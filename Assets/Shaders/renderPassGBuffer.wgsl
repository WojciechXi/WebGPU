struct Uniforms {
    viewMatrix : mat4x4<f32>,
    projectionMatrix : mat4x4<f32>,
    viewProjectionMatrix : mat4x4<f32>,
    viewProjectionInverseMatrix : mat4x4<f32>,
    modelMatrix : mat4x4<f32>,

    lightDirection : vec3<f32>,
    lightColor : vec4<f32>,
    ambientLightColor : vec4<f32>,

    color : vec4<f32>,
};

struct Vertex {
    @location(0) position: vec4<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) color: vec3<f32>,
    @location(3) uv: vec2<f32>,
};

@group(0) @binding(0) var<uniform> uni : Uniforms;

struct VSOut {
  @builtin(position) position : vec4<f32>,
  @location(0) normal  : vec3<f32>, // nowa
};

@vertex
fn vs(vert: Vertex) -> VSOut {
  var vsOut: VSOut;
  
  vsOut.position = uni.viewProjectionMatrix * vert.position;
  vsOut.normal = (uni.viewProjectionMatrix * vec4<f32>(vert.normal, 0.0)).xyz;

  return vsOut;
}

struct FSOut {
  @location(0) positionOut : vec4<f32>,
  @location(1) normalOut : vec4<f32>,
};

fn encodePosition(p: vec3<f32>) -> vec3<f32> {
    return (p * 0.5) + vec3<f32>(0.5);
}

fn encodeNormal(n: vec3<f32>) -> vec3<f32> {
  return n * 0.5 + vec3<f32>(0.5);
}

@fragment
fn fs(vsOut: VSOut) -> FSOut {
  var fsOut: FSOut;

  fsOut.positionOut = vsOut.position;
  fsOut.normalOut  = vec4<f32>(encodeNormal(normalize(vsOut.normal)), 1.0);

  return fsOut;
}