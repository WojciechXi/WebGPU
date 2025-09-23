struct Uniforms {
    modelMatrix : mat4x4<f32>,
    viewMatrix : mat4x4<f32>,
    projectionMatrix : mat4x4<f32>,
    viewProjectionMatrix : mat4x4<f32>,
};

struct Vertex {
    @location(0) position: vec4f,
    @location(1) normal: vec3f,
    @location(2) color: vec3f,
    @location(3) uv: vec2f,
};

@group(0) @binding(0) var<uniform> uni : Uniforms;
@group(0) @binding(1) var ourSampler: sampler;
@group(0) @binding(2) var ourTexture: texture_2d<f32>;

struct VSOut {
    @builtin(position) position: vec4f,
    @location(1) uv: vec2f,
};

@vertex
fn vs(vert: Vertex) -> VSOut {
  var vsOut: VSOut;
    vsOut.position = uni.viewProjectionMatrix * uni.modelMatrix * vert.position;
    vsOut.uv = vert.uv;
    return vsOut;
}

struct FSOut {
  @location(0) colorOut : vec4<f32>,
};

@fragment
fn fs(vsOut: VSOut) -> FSOut {
    var fsOut: FSOut;

    fsOut.colorOut = textureSample(ourTexture, ourSampler, vsOut.uv);

    return fsOut;
}
