fn transpose3(m: mat3x3f) -> mat3x3f {
    return mat3x3f(
        vec3<f32>(m[0][0], m[1][0], m[2][0]),
        vec3<f32>(m[0][1], m[1][1], m[2][1]),
        vec3<f32>(m[0][2], m[1][2], m[2][2])
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
        vec3<f32>(A, D, G) * invDet,
        vec3<f32>(B, E, H) * invDet,
        vec3<f32>(C, F, I) * invDet
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

struct View {
    matrix : mat4x4f,
    projection : mat4x4f,
    viewProjection : mat4x4f,
    inverseView : mat4x4f,
    inverseViewProjection : mat4x4f,
};

struct Material {
    color : vec4<f32>,
    emissive: vec4<f32>,
    pbr : vec4<f32>,
};

struct Vertex {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) tangent: vec4<f32>,
    @location(3) color: vec4<f32>,
    @location(4) uv: vec2f,
    @location(5) joints: vec4<f32>,
    @location(6) weights: vec4<f32>,

    @location(7) m0 : vec4<f32>,
    @location(8) m1 : vec4<f32>,
    @location(9) m2 : vec4<f32>,
    @location(10) m3 : vec4<f32>,
};

@group(0) @binding(0) var<uniform> view : View;
@group(1) @binding(0) var<uniform> material : Material;

@group(2) @binding(0) var textureSampler : sampler;
@group(2) @binding(1) var albedoTexture : texture_2d<f32>;
@group(2) @binding(2) var normalTexture : texture_2d<f32>;
@group(2) @binding(3) var roughnessTexture : texture_2d<f32>;
@group(2) @binding(4) var metallicTexture : texture_2d<f32>;
@group(2) @binding(5) var occlusionTexture : texture_2d<f32>;

@group(3) @binding(0) var<uniform> jointMatrices : array<mat4x4f, 64>;

struct VSOut {
  @builtin(position) clipPosition : vec4<f32>,
  @location(0) worldPosition : vec3<f32>,
  @location(1) worldTangent  : vec3<f32>,
  @location(2) worldBitangent  : vec3<f32>,
  @location(3) worldNormal  : vec3<f32>,
  @location(4) uv : vec2f,
  @location(5) @interpolate(flat) color : vec4<f32>,
};

@vertex
fn vs(vert: Vertex) -> VSOut {
  var vsOut: VSOut;
  let matrix = mat4x4<f32>(vert.m0, vert.m1, vert.m2, vert.m3);

  var objectPosition = vert.position;
  var objectNormal = vert.normal;
  var objectTangent = vert.tangent;
  var worldPosition = (matrix * vec4<f32>(objectPosition, 1.0)).xyz;

  vsOut.worldPosition = worldPosition;
  vsOut.clipPosition = view.viewProjection * vec4<f32>(worldPosition, 1.0);

  let normalMatrix = getNormalMatrix(matrix);
  
  let T = normalize(normalMatrix * objectTangent.xyz);
  let N = normalize(normalMatrix * objectNormal);
  let B = normalize(cross(N, T) * objectTangent.w);

  vsOut.worldTangent = T;
  vsOut.worldBitangent = B;
  vsOut.worldNormal = N;
  vsOut.uv = vert.uv; 
  vsOut.color = vert.color;
  
  return vsOut;
}

//shadowRenderPass

struct ShadowRenderPass {
  @location(0) depthOut : vec4<f32>,
}

@fragment
fn shadowRenderPass(vsOut: VSOut) -> ShadowRenderPass {
  var shadowRenderPass: ShadowRenderPass;

  let clipPosition = vsOut.clipPosition;
  let ndc = (clipPosition.xyz / clipPosition.w);

  shadowRenderPass.depthOut = vec4<f32>(ndc.z, 0, 0, 1.0);

  return shadowRenderPass;
}

//gBufferRenderPass

struct GBufferRenderPass {
  @location(0) positionOut : vec4<f32>,
  @location(1) normalOut : vec4<f32>,
  
  @location(2) colorOut : vec4<f32>, // Color
  @location(3) emissiveOut : vec4<f32>, // Emission
  @location(4) pbrOut : vec4<f32>, // Smoothness / Metallic / Ambient Occlusion
  
  @location(5) depthOut : vec4<f32>,
}

@fragment
fn gBufferRenderPass(vsOut: VSOut) -> GBufferRenderPass {
  var gBufferRenderPass: GBufferRenderPass;

  let albedo = textureSample(albedoTexture, textureSampler, vsOut.uv);
  
  let _roughness = material.pbr.r;
  let _metallic = material.pbr.g;
  let _occlusion = material.pbr.b;

  let normal = textureSample(normalTexture, textureSampler, vsOut.uv).xyz * 2.0 - 1.0;
  let roughness = textureSample(roughnessTexture, textureSampler, vsOut.uv);
  let metallic = textureSample(metallicTexture, textureSampler, vsOut.uv);
  let occlusion = textureSample(occlusionTexture, textureSampler, vsOut.uv);

  gBufferRenderPass.positionOut = vec4<f32>(vsOut.worldPosition, 1.0);

  let TBN = mat3x3f(vsOut.worldTangent, vsOut.worldBitangent, vsOut.worldNormal);
  gBufferRenderPass.normalOut = vec4<f32>(normalize(TBN * normal) * 0.5 + 0.5, 0.0);

  gBufferRenderPass.colorOut = albedo * material.color * vsOut.color;
  gBufferRenderPass.emissiveOut = material.emissive;
  gBufferRenderPass.pbrOut = vec4<f32>(roughness.r * _roughness, metallic.r * _metallic, occlusion.r * _occlusion, 0);

  gBufferRenderPass.depthOut = vec4<f32>(vsOut.clipPosition.z / vsOut.clipPosition.w, 0.0, 0.0, 1.0);

  return gBufferRenderPass;
}