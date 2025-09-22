struct Uniforms {
    viewProjectionMatrix : mat4x4<f32>,
    viewProjectionInverseMatrix : mat4x4<f32>,
    matrix : mat4x4<f32>,

    lightDirection : vec3<f32>,
    lightColor : vec4<f32>,
    ambientLightColor : vec4<f32>,

    color : vec4<f32>,
};

struct Vertex {
    @location(0) position: vec4f,
    @location(1) normal: vec3f,
    @location(2) color: vec3f,
    @location(3) uv: vec2f,
};

@group(0) @binding(0) var<uniform> uni : Uniforms;

struct VSOut {
  @builtin(position) position : vec4<f32>,
  @location(0) worldPosition : vec3<f32>,
  @location(1) normal : vec3<f32>,
};

@vertex
fn vs(vert: Vertex) -> VSOut {
  var out: VSOut;

  let world = (uni.matrix * vert.position).xyz;
  out.worldPosition = world;

  out.position = uni.viewProjectionMatrix * vec4<f32>(world,1.0);
  out.normal = (uni.matrix * vec4<f32>(vert.normal,0)).xyz;

  return out;
}

struct FSOut {
  @location(0) colorOut : vec4<f32>,
};

@fragment
fn fs(in: VSOut) -> FSOut {
  var out: FSOut;

  out.colorOut = vec4<f32>(normalize(in.normal),1.0);

  return out;
}
