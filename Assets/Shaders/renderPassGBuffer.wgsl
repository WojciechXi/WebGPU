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

struct VSOut {
  @builtin(position) position : vec4f,   // obowiązkowy clip-space do rasteryzacji
  @location(0) normal  : vec3f,
  @location(1) viewPos : vec3f,
  @location(2) worldPos : vec3f,
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

  return vsOut;
}

struct FSOut {
  @location(0) positionOut : vec4f,
  @location(1) viewPositionOut : vec4f,
  @location(2) normalOut : vec4f,
  @location(3) viewNormalOut : vec4f,
};

fn encodeVector(n: vec3f) -> vec3f {
  return n * 0.5 + vec3f(0.5);
}

@fragment
fn fs(vsOut: VSOut) -> FSOut {
  var fsOut: FSOut;

  // zapis pozycji w przestrzeni widoku
  fsOut.positionOut = vec4f(vsOut.worldPos, 1.0);

  // zapis pozycji w przestrzeni widoku
  fsOut.viewPositionOut = vec4f(vsOut.viewPos, 1.0);

  // zapis normalnych (możesz też przenieść do view space)
  fsOut.normalOut = vec4f(encodeVector(normalize(vsOut.normal)), 1.0);

  let viewNormal = normalize((uni.viewMatrix * vec4f(vsOut.normal, 0.0)).xyz);
  fsOut.viewNormalOut = vec4f(viewNormal, 0.0);

  return fsOut;
}
