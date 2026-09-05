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

struct Vertex {    
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) tangent: vec4f,
    @location(3) color: vec4f,
    @location(4) uv: vec2f,
    @location(5) joints: vec4f,
    @location(6) weights: vec4f,
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

struct VertexOut {
  @builtin(position) clipPosition : vec4f,
  @location(0) worldPosition : vec3f,
  @location(1) worldTangent  : vec3f,
  @location(2) worldBitangent  : vec3f,
  @location(3) worldNormal  : vec3f,
  @location(4) uv : vec2f,
};

@vertex
fn vs(vertex: Vertex) -> VertexOut {
  var vertexOut: VertexOut;
  let matrix = mat4x4<f32>(vertex.m0, vertex.m1, vertex.m2, vertex.m3);

  var objectPosition = vertex.position;
  var objectNormal = vertex.normal;
  var objectTangent = vertex.tangent;
  var worldPosition : vec3f;

  if(vertex.weights.x > 0.001) {
    let skinMatrix = jointMatrices[u32(vertex.joints.x)];
    worldPosition = (skinMatrix * vec4f(objectPosition, 1.0)).xyz;

    let skinMatrix3 = mat3x3f(skinMatrix[0].xyz, skinMatrix[1].xyz, skinMatrix[2].xyz);
    objectNormal = skinMatrix3 * objectNormal;
    objectTangent = vec4f(skinMatrix3 * objectTangent.xyz, objectTangent.w);
  } else {
    worldPosition = (matrix * vec4f(objectPosition, 1.0)).xyz;
  }

  vertexOut.worldPosition = worldPosition;
  vertexOut.clipPosition = view.viewProjection * vec4f(worldPosition, 1.0);

  let normalMatrix = getNormalMatrix(matrix);
  
  let T = normalize(normalMatrix * objectTangent.xyz);
  let N = normalize(normalMatrix * objectNormal);
  let B = normalize(cross(N, T) * objectTangent.w);

  vertexOut.worldTangent = T;
  vertexOut.worldBitangent = B;
  vertexOut.worldNormal = N;
  vertexOut.uv = vertex.uv; 
  
  return vertexOut;
}

//shadowRenderPass

struct ShadowRenderPass {
  @location(0) depthOut : vec4f,
}

@fragment
fn shadowRenderPass(vertexOut: VertexOut) -> ShadowRenderPass {
  var shadowRenderPass: ShadowRenderPass;

  let clipPosition = vertexOut.clipPosition;
  let ndc = (clipPosition.xyz / clipPosition.w);

  shadowRenderPass.depthOut = vec4f(ndc.z, 0, 0, 1.0);

  return shadowRenderPass;
}

//gBufferRenderPass

struct GBufferRenderPass {
  @location(0) positionOut : vec4f,
  @location(1) normalOut : vec4f,
  @location(2) colorOut : vec4f, // Color
  @location(3) pbrOut : vec4f, // Smoothness / Metallic / Ambient Occlusion
}

@fragment
fn gBufferRenderPass(vertexOut: VertexOut) -> GBufferRenderPass {
  var gBufferRenderPass: GBufferRenderPass;

  let albedo = textureSample(albedoTexture, textureSampler, vertexOut.uv);
  let color = albedo * material.color;
  if(color.a < material.pbr.a) {
    discard;
  }
  
  let _roughness = material.pbr.r;
  let _metallic = material.pbr.g;
  let _occlusion = material.pbr.b;

  let normal = textureSample(normalTexture, textureSampler, vertexOut.uv).xyz * 2.0 - 1.0;
  let roughness = textureSample(roughnessTexture, textureSampler, vertexOut.uv);
  let metallic = textureSample(metallicTexture, textureSampler, vertexOut.uv);
  let occlusion = textureSample(occlusionTexture, textureSampler, vertexOut.uv);

  gBufferRenderPass.positionOut = vec4f(vertexOut.worldPosition, 1.0);

  let TBN = mat3x3f(vertexOut.worldTangent, vertexOut.worldBitangent, vertexOut.worldNormal);
  gBufferRenderPass.normalOut = vec4f(normalize(TBN * normal) * 0.5 + 0.5, 0.0);

  gBufferRenderPass.colorOut = color;
  gBufferRenderPass.pbrOut = vec4f(roughness.r * _roughness, metallic.r * _metallic, occlusion.r * _occlusion, 0);

  return gBufferRenderPass;
}