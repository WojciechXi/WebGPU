struct View {
    matrix: mat4x4f,
    projection: mat4x4f,
    viewProjection: mat4x4f,
    inverseView: mat4x4f,
    inverseViewProjection: mat4x4f,
};

struct Material {
    color: vec4f,
    pbr: vec4f,
};

struct VertexInput {    
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) tangent: vec4f,
    @location(3) color: vec4f,
    @location(4) uv: vec2f,
    @location(5) joints: vec4f,
    @location(6) weights: vec4f,
    @location(7) m0: vec4f,
    @location(8) m1: vec4f,
    @location(9) m2: vec4f,
    @location(10) m3: vec4f,
};

@group(0) @binding(0) var<uniform> view: View;
@group(1) @binding(0) var<uniform> material: Material;

@group(2) @binding(0) var textureSampler: sampler;
@group(2) @binding(1) var albedoTexture: texture_2d<f32>;
@group(2) @binding(2) var normalTexture: texture_2d<f32>;
@group(2) @binding(3) var pbrTexture: texture_2d<f32>;
@group(2) @binding(4) var emissiveTexture: texture_2d<f32>;

@group(3) @binding(0) var<uniform> jointMatrices: array<mat4x4f, 64>;

struct VertexOutput {
    @builtin(position) clipPosition: vec4f,
    @location(0) worldPosition: vec3f,
    @location(1) worldNormal: vec3f,
    @location(2) worldTangent: vec3f,
    @location(3) worldBitangent: vec3f,
    @location(4) uv: vec2f,
};


fn inverse3x3(m: mat3x3f) -> mat3x3f {
    let a00 = m[0][0]; let a01 = m[0][1]; let a02 = m[0][2];
    let a10 = m[1][0]; let a11 = m[1][1]; let a12 = m[1][2];
    let a20 = m[2][0]; let a21 = m[2][1]; let a22 = m[2][2];

    let b01 = a22 * a11 - a12 * a21;
    let b11 = -a22 * a10 + a12 * a20;
    let b21 = a21 * a10 - a11 * a20;

    let det = a00 * b01 + a01 * b11 + a02 * b21;
    let invDet = 1.0 / det;

    return mat3x3f(
        vec3f(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11)) * invDet,
        vec3f(b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10)) * invDet,
        vec3f(b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) * invDet
    );
}

fn getNormalMatrix(m: mat4x4f) -> mat3x3f {
    let m3 = mat3x3f(m[0].xyz, m[1].xyz, m[2].xyz);
    
    return transpose(inverse3x3(m3));
}

@vertex
fn vs(vertexInput: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    
    let modelMatrix = mat4x4f(vertexInput.m0, vertexInput.m1, vertexInput.m2, vertexInput.m3);
    
    let pos = vertexInput.position;
    let norm = vertexInput.normal;
    let tang = vertexInput.tangent.xyz;

    var worldPos: vec3f;
    var normalMat: mat3x3f;
    var model3x3: mat3x3f;

    
    if (vertexInput.weights.x > 0.0) {
        
        let w = vertexInput.weights;
        let j = vec4u(vertexInput.joints);
        
        let skinMatrix = jointMatrices[j.x] * w.x +
                         jointMatrices[j.y] * w.y +
                         jointMatrices[j.z] * w.z +
                         jointMatrices[j.w] * w.w;

        worldPos = (skinMatrix * vec4f(pos, 1.0)).xyz;
        normalMat = getNormalMatrix(skinMatrix);
        model3x3 = mat3x3f(skinMatrix[0].xyz, skinMatrix[1].xyz, skinMatrix[2].xyz);
    } else {
        worldPos = (modelMatrix * vec4f(pos, 1.0)).xyz;
        normalMat = getNormalMatrix(modelMatrix);
        model3x3 = mat3x3f(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz);
    }

    
    let N = normalize(normalMat * norm);
    let T_unaligned = normalize(model3x3 * tang);
    
    
    let T = normalize(T_unaligned - dot(T_unaligned, N) * N);
    
    
    let tangentSign = select(1.0, -1.0, vertexInput.tangent.w < 0.0);
    let B = normalize(cross(N, T) * tangentSign);

    output.clipPosition = view.viewProjection * vec4f(worldPos, 1.0);
    output.worldPosition = worldPos;
    output.worldNormal = N;
    output.worldTangent = T;
    output.worldBitangent = B;
    output.uv = vertexInput.uv;

    return output;
}

struct PreDepthRenderPass {
    @location(0) depth: vec4f,
};

@fragment
fn preDepthRenderPass(input: VertexOutput) -> PreDepthRenderPass {
    var output: PreDepthRenderPass;
    output.depth = vec4f(input.clipPosition.z, 0.0, 0.0, 1.0);
    return output;
}

struct GBufferRenderPass {
    @location(0) color: vec4f,
    @location(1) worldNormal: vec4f,
    @location(2) pbr: vec4f,
    @location(3) emissive: vec4f,
};

@fragment
fn gBufferRenderPass(input: VertexOutput) -> GBufferRenderPass {
    var output: GBufferRenderPass;
    
    let albedo = textureSample(albedoTexture, textureSampler, input.uv) * material.color;
    if (albedo.a < material.pbr.a) {
        discard;
    }

    
    let rawNormal = textureSample(normalTexture, textureSampler, input.uv).xyz * 2.0 - 1.0;
    
    
    let TBN = mat3x3f(
        normalize(input.worldTangent), 
        normalize(input.worldBitangent), 
        normalize(input.worldNormal)
    );

    let worldNormal = normalize(TBN * rawNormal);

    output.color = albedo;
    
    output.worldNormal = vec4f(worldNormal * 0.5 + 0.5, 1.0);
    
    let rawPbr = textureSample(pbrTexture, textureSampler, input.uv);
    output.pbr = vec4f(rawPbr.rgb * material.pbr.rgb, 1.0);
    output.emissive = textureSample(emissiveTexture, textureSampler, input.uv);

    return output;
}