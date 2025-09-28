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
    let m3 = mat3x3f(
        modelMatrix[0].xyz,
        modelMatrix[1].xyz,
        modelMatrix[2].xyz
    );
    return transpose3(inverse3(m3));
}

struct Uniforms {
    modelMatrix : mat4x4f,
    viewMatrix : mat4x4f,
    projectionMatrix : mat4x4f,
    color : vec4f,
    pbr : vec4f,
};

struct Vertex {
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) tangent: vec4f,
    @location(3) color: vec4f,
    @location(4) uv: vec2f,
};

@group(0) @binding(0) var<uniform> uni : Uniforms;
@group(0) @binding(1) var textureSampler : sampler;
@group(0) @binding(2) var albedoTexture : texture_2d<f32>;
@group(0) @binding(3) var normalTexture : texture_2d<f32>;
@group(0) @binding(4) var roughnessTexture : texture_2d<f32>;
@group(0) @binding(5) var metallicTexture : texture_2d<f32>;
@group(0) @binding(6) var occlusionTexture : texture_2d<f32>;

struct VSOut {
  @builtin(position) clipPosition : vec4f,
  @location(0) worldPosition : vec3f,
  @location(1) worldTangent  : vec3f,
  @location(2) worldBitangent  : vec3f,
  @location(3) worldNormal  : vec3f,
  @location(4) uv : vec2f,
};

@vertex
fn vs(vert: Vertex) -> VSOut {
  var vsOut: VSOut;

  let modelMatrix = uni.modelMatrix;
  let viewMatrix = uni.viewMatrix;
  let projectionMatrix = uni.projectionMatrix;

  let worldPosition = (modelMatrix * vec4f(vert.position, 1.0)).xyz;
  let clipPosition = projectionMatrix * viewMatrix * vec4f(worldPosition, 1.0);

  vsOut.clipPosition = clipPosition;
  vsOut.worldPosition = worldPosition;

  let normalMatrix = getNormalMatrix(modelMatrix);
  
  let T = normalize(normalMatrix * vert.tangent.xyz);
  let N = normalize(normalMatrix * vert.normal);  
  let B = normalize(cross(T, N) * vert.tangent.w);

  vsOut.worldTangent = T;
  vsOut.worldBitangent = B;
  vsOut.worldNormal = N;
  vsOut.uv = vert.uv; 
  
  return vsOut;
}

//shadowRenderPass

struct ShadowRenderPass {
  @location(0) depthOut : vec4f,
}

@fragment
fn shadowRenderPass(vsOut: VSOut) -> ShadowRenderPass {
  var shadowRenderPass: ShadowRenderPass;

  let albedo = textureSample(albedoTexture, textureSampler, vsOut.uv);
  let normal = textureSample(normalTexture, textureSampler, vsOut.uv);
  let roughness = textureSample(roughnessTexture, textureSampler, vsOut.uv);
  let metallic = textureSample(metallicTexture, textureSampler, vsOut.uv);
  let occlusion = textureSample(occlusionTexture, textureSampler, vsOut.uv);

  let clipPosition = vsOut.clipPosition;
  let ndc = (clipPosition.xyz / clipPosition.w);
  let depth = ndc.z;

  shadowRenderPass.depthOut = vec4f(depth, 0, 0, 1.0);

  return shadowRenderPass;
}

//gBufferRenderPass

struct GBufferRenderPass {
  @location(0) worldPositionOut : vec4f,
  @location(1) worldNormalOut : vec4f,
  
  @location(2) colorOut : vec4f, // Color / Emission
  @location(3) pbrOut : vec4f, // Smoothness / Metallic / Ambient Occlusion
  
  @location(4) depthOut : vec4f,
}

@fragment
fn gBufferRenderPass(vsOut: VSOut) -> GBufferRenderPass {
  var gBufferRenderPass: GBufferRenderPass;

  let TBN = mat3x3f(vsOut.worldTangent, vsOut.worldBitangent, vsOut.worldNormal);

  let albedo = textureSample(albedoTexture, textureSampler, vsOut.uv);
  let normal = textureSample(normalTexture, textureSampler, vsOut.uv).xyz * 2.0 - 1.0;
  let roughness = textureSample(roughnessTexture, textureSampler, vsOut.uv);
  let metallic = textureSample(metallicTexture, textureSampler, vsOut.uv);
  let occlusion = textureSample(occlusionTexture, textureSampler, vsOut.uv);

  gBufferRenderPass.worldPositionOut = vec4f(vsOut.worldPosition, 1.0);
  gBufferRenderPass.worldNormalOut = vec4f(normalize(TBN * normal), 0.0);

  gBufferRenderPass.colorOut = vec4f(albedo.rgb * uni.color.rgb, 0.0);
  gBufferRenderPass.pbrOut = vec4f(roughness.r, metallic.r, occlusion.r, 0.0);

  gBufferRenderPass.depthOut = vec4f(vsOut.clipPosition.z / vsOut.clipPosition.w, 0.0, 0.0, 1.0);

  return gBufferRenderPass;
}