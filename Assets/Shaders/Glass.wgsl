fn encodeVector(n: vec3f) -> vec3f {
  return n * 0.5 + vec3f(0.5);
}

struct Uniforms {
    modelMatrix : mat4x4f,
    viewMatrix : mat4x4f,
    projectionMatrix : mat4x4f,
    viewProjectionMatrix : mat4x4f,
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
  vsOut.normal   = (uni.modelMatrix * vec4f(vert.normal, 0.0)).xyz;
  vsOut.viewPos  = viewPos.xyz;
  vsOut.worldPos = worldPos.xyz;
  vsOut.uv = vert.uv;

  return vsOut;
}

struct FSOut {
  @location(0) colorOut : vec4f,
};

@fragment
fn fs(vsOut: VSOut) -> FSOut {
    var fsOut: FSOut;

    fsOut.colorOut = textureSample(albedo, textureSampler, vsOut.uv);

    return fsOut;
}

//forwardRenderPass

struct ForwardRenderPass {
  @location(0) colorOut : vec4f,
  @location(1) depthOut : vec4f,
}

@fragment
fn forwardRenderPass(vsOut: VSOut) -> ForwardRenderPass {
    var forwardRenderPass: ForwardRenderPass;

    let color = textureSample(albedo, textureSampler, vsOut.uv);
    forwardRenderPass.colorOut = vec4f(0, 0, 0, 0.1);
    forwardRenderPass.depthOut = vec4f(vsOut.position.z, 0.0, 0.0, 1.0);

    return forwardRenderPass;
}