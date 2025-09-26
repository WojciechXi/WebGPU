fn encodeVector(n: vec3f) -> vec3f {
  return n * 0.5 + vec3f(0.5);
}

fn mat3_from_mat4(m: mat4x4f) -> mat3x3f {
    return mat3x3f(
        m[0].xyz,
        m[1].xyz,
        m[2].xyz
    );
}

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
@group(0) @binding(4) var ambientOcclusionTexture : texture_2d<f32>;
@group(0) @binding(5) var heightTexture : texture_2d<f32>;

struct VSOut {
  @builtin(position) clipPosition : vec4f,
  @location(0) worldPosition : vec3f,
  @location(2) viewPosition : vec3f,
  @location(3) normal  : vec3f,
  @location(4) tangent  : vec4f,
  @location(5) uv : vec2f,
};

@vertex
fn vs(vert: Vertex) -> VSOut {
  var vsOut: VSOut;

  let modelMatrix = uni.modelMatrix;
  let viewMatrix = uni.viewMatrix;
  let projectionMatrix = uni.projectionMatrix;

  let worldPosition = (modelMatrix * vec4f(vert.position, 1.0)).xyz;
  let viewPosition = (viewMatrix * vec4f(worldPosition, 1.0)).xyz;
  let clipPosition = projectionMatrix * viewMatrix * vec4f(worldPosition, 1.0);

  vsOut.clipPosition = clipPosition;
  vsOut.worldPosition = worldPosition;
  vsOut.viewPosition = viewPosition;

  let normalMatrix = transpose3(inverse3(mat3_from_mat4(viewMatrix * modelMatrix)));
  vsOut.normal = normalize(normalMatrix * vert.normal);
  vsOut.tangent = vert.tangent;
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

  let color = uni.color;
  let albedo = textureSample(albedoTexture, textureSampler, vsOut.uv);
  let normal = textureSample(normalTexture, textureSampler, vsOut.uv);
  let ambientOcclusion = textureSample(ambientOcclusionTexture, textureSampler, vsOut.uv);
  let height = textureSample(heightTexture, textureSampler, vsOut.uv);

  shadowRenderPass.depthOut = vec4f(vsOut.viewPosition.z, 0.0, 0.0, 1.0);

  return shadowRenderPass;
}

//gBufferRenderPass

struct GBufferRenderPass {
  @location(0) viewPositionOut : vec4f,
  @location(1) viewNormalOut : vec4f,
  
  @location(2) colorOut : vec4f, // Color / Emission
  @location(3) pbrOut : vec4f, // Smoothness / Metallic / Ambient Occlusion
  
  @location(4) depthOut : vec4f,
}

@fragment
fn gBufferRenderPass(vsOut: VSOut) -> GBufferRenderPass {
  var gBufferRenderPass: GBufferRenderPass;

  let color = uni.color;
  let albedo = textureSample(albedoTexture, textureSampler, vsOut.uv);

  let normalMap = textureSample(normalTexture, textureSampler, vsOut.uv);
  let normalTangent = normalize(normalMap.rgb * 2.0 - 1.0);

  let T = normalize(vsOut.tangent.xyz);
  let N = normalize(vsOut.normal);
  let B = cross(N, T) * vsOut.tangent.w;

  let TBN = mat3x3f(T, B, N);
  let normalView = normalize(TBN * normalTangent);

  let ambientOcclusion = textureSample(ambientOcclusionTexture, textureSampler, vsOut.uv);
  let height = textureSample(heightTexture, textureSampler, vsOut.uv);

  let targetColor = albedo.rgb * color.rgb;

  gBufferRenderPass.viewPositionOut = vec4f(vsOut.viewPosition, 1.0);
  gBufferRenderPass.viewNormalOut = vec4f(normalView, 0.0);

  gBufferRenderPass.colorOut = vec4f(targetColor, 0.0);
  gBufferRenderPass.pbrOut = vec4f(0.5, 0.5, ambientOcclusion.r, 0.0);

  gBufferRenderPass.depthOut = vec4f(vsOut.viewPosition.z, 0.0, 0.0, 1.0);

  return gBufferRenderPass;
}