fn transpose3(m: mat3x3f) -> mat3x3f {
    return mat3x3f(
        vec3f(m[0][0], m[1][0], m[2][0]),
        vec3f(m[0][1], m[1][1], m[2][1]),
        vec3f(m[0][2], m[1][2], m[2][2])
    );
}

fn inverse3(m: mat3x3f) -> mat3x3f {
    let a = m[0][0]; let b = m[0][1]; let c = m[0][2];
    let d = m[1][0]; let e = m[1][1]; let f = m[1][2];
    let g = m[2][0]; let h = m[2][1]; let i = m[2][2];

    let A =  (e*i - f*h);
    let B = -(d*i - f*g);
    let C =  (d*h - e*g);
    let D = -(b*i - c*h);
    let E =  (a*i - c*g);
    let F = -(a*h - b*g);
    let G =  (b*f - c*e);
    let H = -(a*f - c*d);
    let I =  (a*e - b*d);

    let det = a*A + b*B + c*C;
    let invDet = 1.0 / det;

    return mat3x3f(
        vec3f(A, D, G) * invDet,
        vec3f(B, E, H) * invDet,
        vec3f(C, F, I) * invDet
    );
}

fn getNormalMatrix(modelMatrix: mat4x4f) -> mat3x3f {
    let m3 = mat3x3f(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz);
    return transpose3(inverse3(m3));
}

struct View {
    matrix : mat4x4f,
    projection : mat4x4f,
    viewProjection : mat4x4f,
    inverseView : mat4x4f,
    inverseViewProjection : mat4x4f,
};

struct Material {
    color : vec4f,
    pbr : vec4f,
};

struct VertexInput {    
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) tangent: vec4f,
    @location(3) color: vec4f,
    @location(4) uv: vec2f,
    @location(5) joints: vec4f,
    @location(6) weights: vec4f,
    @location(7) m0 : vec4f,
    @location(8) m1 : vec4f,
    @location(9) m2 : vec4f,
    @location(10) m3 : vec4f,
};

@group(0) @binding(0) var<uniform> view : View;
@group(1) @binding(0) var<uniform> material : Material;

@group(2) @binding(0) var textureSampler : sampler;
@group(2) @binding(1) var albedoTexture : texture_2d<f32>;
@group(2) @binding(2) var normalTexture : texture_2d<f32>;
@group(2) @binding(3) var pbrTexture : texture_2d<f32>;
@group(2) @binding(4) var emissiveTexture : texture_2d<f32>;

@group(3) @binding(0) var<uniform> jointMatrices : array<mat4x4f, 64>;

struct VertexOutput {
    @builtin(position) clipPosition : vec4f,
    @location(0) worldPosition : vec3f,
    @location(1) worldNormal : vec3f,
    @location(2) worldTangent : vec3f,
    @location(3) worldBitangent : vec3f,
    @location(4) uv : vec2f,
};

@vertex
fn vs(vertexInput: VertexInput) -> VertexOutput {
    var vertexOutput: VertexOutput;
    let matrix = mat4x4f(vertexInput.m0, vertexInput.m1, vertexInput.m2, vertexInput.m3);
    
    let pos  = vertexInput.position;
    let norm = vertexInput.normal;
    let tang = vertexInput.tangent.xyz;

    var worldPos: vec3f;
    var N: vec3f;
    var T_raw: vec3f;

    if (vertexInput.weights.x > 0.001) {
        let skinMatrix = jointMatrices[u32(vertexInput.joints.x)];
        worldPos = (skinMatrix * vec4f(pos, 1.0)).xyz;
        let skinMatrix3 = mat3x3f(skinMatrix[0].xyz, skinMatrix[1].xyz, skinMatrix[2].xyz);
        N = normalize(skinMatrix3 * norm);
        T_raw = normalize(skinMatrix3 * tang);
    } else {
        worldPos = (matrix * vec4f(pos, 1.0)).xyz;
        
        let normalMatrix = getNormalMatrix(matrix);
        N = normalize(normalMatrix * norm);
        
        let model3x3 = mat3x3f(matrix[0].xyz, matrix[1].xyz, matrix[2].xyz);
        T_raw = normalize(model3x3 * tang);
    }

    let T = normalize(T_raw - dot(T_raw, N) * N);

    let tangentSign = select(1.0, vertexInput.tangent.w, abs(vertexInput.tangent.w) > 0.001);
    let B = normalize(cross(N, T) * tangentSign);

    vertexOutput.clipPosition = view.viewProjection * vec4f(worldPos, 1.0);
    vertexOutput.worldPosition = worldPos;
    vertexOutput.worldNormal = N;
    vertexOutput.worldTangent = T;
    vertexOutput.worldBitangent = B;
    vertexOutput.uv = vertexInput.uv;

    return vertexOutput;
}

struct PreDepthRenderPass {
    @location(0) depth : vec4f,
};

@fragment
fn preDepthRenderPass(vertexOutput: VertexOutput) -> PreDepthRenderPass {
    var preDepthRenderPass: PreDepthRenderPass;
    // W WebGPU builtin position (.z) zawiera już poprawny zakres z-buffera [0.0, 1.0]
    preDepthRenderPass.depth = vec4f(vertexOutput.clipPosition.z, 0.0, 0.0, 1.0);
    return preDepthRenderPass;
}

struct ShadowRenderPass {
    @location(0) depth : vec4f,
};

@fragment
fn shadowRenderPass(vertexOutput: VertexOutput) -> ShadowRenderPass {
    var shadowRenderPass: ShadowRenderPass;
    shadowRenderPass.depth = vec4f(vertexOutput.clipPosition.z, 0.0, 0.0, 1.0);
    return shadowRenderPass;
}

struct GBufferRenderPass {
    @location(0) color : vec4f,
    @location(1) worldNormal : vec4f,
    @location(2) pbr : vec4f,
    @location(3) emissive : vec4f,
};

@fragment
fn gBufferRenderPass(vertexOutput: VertexOutput) -> GBufferRenderPass {
    var gBufferRenderPass: GBufferRenderPass;
    
    let color = textureSample(albedoTexture, textureSampler, vertexOutput.uv) * material.color;
    if (color.a < material.pbr.a) {
        discard;
    }

    let rawNormal = normalize(textureSample(normalTexture, textureSampler, vertexOutput.uv).xyz * 2.0 - 1.0); // Normal
    let rawPbr = textureSample(pbrTexture, textureSampler, vertexOutput.uv); // Roughness, Metallic, Occlusion

    let TBN = mat3x3f(normalize(vertexOutput.worldTangent),normalize(vertexOutput.worldBitangent),normalize(vertexOutput.worldNormal));

    // Zapis zmapowany na [0.0, 1.0] dla rgba8unorm
    gBufferRenderPass.color = color;
    gBufferRenderPass.worldNormal = vec4f(normalize(TBN * rawNormal) * 0.5 + 0.5, 1.0);
    gBufferRenderPass.pbr = vec4f(rawPbr.r * material.pbr.r, rawPbr.g * material.pbr.g, rawPbr.b * material.pbr.b, 1.0);
    gBufferRenderPass.emissive = textureSample(emissiveTexture, textureSampler, vertexOutput.uv);

    return gBufferRenderPass;
}