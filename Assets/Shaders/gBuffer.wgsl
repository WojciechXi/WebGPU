struct Uniforms {
  viewProj : mat4x4<f32>,
  model : mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> uni : Uniforms;

struct VSOut {
  @builtin(position) pos : vec4<f32>,
  @location(0) worldPos : vec3<f32>,
  @location(1) normal : vec3<f32>,
};

@vertex fn vs(@location(0) position: vec3<f32>,
              @location(1) normal: vec3<f32>) -> VSOut {
  var out: VSOut;
  let world = (uni.model * vec4<f32>(position,1.0)).xyz;
  out.worldPos = world;
  out.normal = (uni.model * vec4<f32>(normal,0.0)).xyz;
  out.pos = uni.viewProj * vec4<f32>(world,1.0);
  return out;
}

// ===== poprawione =====
struct FSOut {
  @location(0) posOut : vec4<f32>,
  @location(1) normOut : vec4<f32>,
};

@fragment fn fs(in: VSOut) -> FSOut {
  var out: FSOut;
  out.posOut = vec4<f32>(in.worldPos,1.0);
  out.normOut = vec4<f32>(normalize(in.normal),1.0);
  return out;
}
