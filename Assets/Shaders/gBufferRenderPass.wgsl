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
  @builtin(position) positionWorld : vec4<f32>,
  @location(0) positionView : vec4<f32>,
  @location(1) normalWorld : vec3<f32>,
  @location(2) normalView  : vec3<f32>, // nowa
  @location(3) uv : vec2<f32>,
  @location(4) vertexColor : vec3<f32>,
};

@vertex
fn vs(vert: Vertex) -> VSOut {
  var out: VSOut;

  // world position
  let worldPos = vec4<f32>((uni.modelMatrix * vert.position).xyz, 1.0);
  out.positionWorld = worldPos;

  // clip space position
  let viewPos = (uni.viewProjectionMatrix * worldPos);
  out.positionView = viewPos;

  // normal w space światowym
  let normalWorld = normalize(vert.normal);
  out.normalWorld = normalWorld;

  // normal w space widoku
  out.normalView = normalize((uni.viewMatrix * vec4<f32>(normalWorld, 0.0)).xyz);

  // uv + kolor wierzchołka
  out.uv = vert.uv;
  out.vertexColor = vert.color;

  return out;
}

struct FSOut {
  @location(0) positionWorldOut : vec4<f32>,
  @location(1) positionViewOut : vec4<f32>,
  @location(2) normalWorldOut  : vec4<f32>,
  @location(3) normalViewOut   : vec4<f32>, 
};

// normal encoding [-1,1] -> [0,1]
fn encodeNormal(n: vec3<f32>) -> vec3<f32> {
  return n * 0.5 + vec3<f32>(0.5);
}

@fragment
fn fs(input: VSOut) -> FSOut {
  var out: FSOut;

  out.positionWorldOut = input.positionWorld;
  out.positionViewOut  = input.positionView;
  out.normalWorldOut   = vec4<f32>(encodeNormal(normalize(input.normalWorld)), 1.0);
  out.normalViewOut    = vec4<f32>(encodeNormal(normalize(input.normalView)), 1.0);

  return out;
}