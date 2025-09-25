fn encodeVector(n: vec3f) -> vec3f {
  return n * 0.5 + vec3f(0.5);
}

struct Uniforms {
    modelMatrix : mat4x4f,
    viewMatrix : mat4x4f,
    projectionMatrix : mat4x4f,
    viewProjectionMatrix : mat4x4f,
    color : vec4f,
    pbr : vec4f,
};

struct Vertex {
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) color: vec3f,
    @location(3) uv: vec2f,
};

@group(0) @binding(0) var<uniform> uni : Uniforms;
@group(0) @binding(1) var textureSampler : sampler;
@group(0) @binding(2) var albedo : texture_2d<f32>;

struct VSOut {
  @builtin(position) position : vec4f,
  @location(0) normal  : vec3f,
  @location(1) viewPos : vec3f,
  @location(2) worldPos : vec3f,
  @location(3) uv : vec2f,
};

@vertex
fn vs(vert: Vertex) -> VSOut {
  var vsOut: VSOut;

  let worldPos = uni.modelMatrix * vec4f(vert.position, 1.0);
  let viewPos  = uni.viewMatrix * worldPos;

  vsOut.position = uni.projectionMatrix * viewPos;
  vsOut.normal   = (uni.viewMatrix * uni.modelMatrix * vec4f(vert.normal, 0.0)).xyz;
  vsOut.viewPos  = viewPos.xyz;
  vsOut.worldPos = worldPos.xyz;
  vsOut.uv = vert.uv;

  return vsOut;
}

//gBufferRenderPass

struct GBufferRenderPass {
  @location(0) screenPositionOut : vec4f,
  @location(1) screenNormalOut : vec4f,
  @location(2) screenTangentOut : vec4f,
  
  @location(3) colorOut : vec4f,
  @location(4) normalOut : vec4f,
  @location(5) emissionOut : vec4f,
  @location(6) pbrOut : vec4f, // Metallic/ Roughness / Smoothness / Occlusion
  
  @location(7) depthOut : vec4f,
}

@fragment
fn gBufferRenderPass(vsOut: VSOut) -> GBufferRenderPass {
  var gBufferRenderPass: GBufferRenderPass;

  let color = uni.color;
  let albedo = textureSample(albedo, textureSampler, vsOut.uv);
  let viewNormal = normalize(vec4f(vsOut.normal, 0.0).xyz);

  gBufferRenderPass.screenPositionOut = vec4f(vsOut.viewPos, 1.0);
  gBufferRenderPass.screenNormalOut = vec4f(viewNormal, 0.0);
  gBufferRenderPass.screenTangentOut = vec4f(1.0, 0.5, 0.0, 1.0);

  gBufferRenderPass.colorOut = vec4f(albedo.rgb * color.rgb, 1.0);
  gBufferRenderPass.normalOut = vec4f(0.0, 1.0, 0.0, 1.0);
  gBufferRenderPass.emissionOut = vec4f(0.0, 0.0, 0.0, 1.0);
  gBufferRenderPass.pbrOut = vec4f(0.0, 0.0, 0.0, 1.0);

  gBufferRenderPass.depthOut = vec4f(vsOut.position.z, 0.0, 0.0, 1.0);

  return gBufferRenderPass;
}