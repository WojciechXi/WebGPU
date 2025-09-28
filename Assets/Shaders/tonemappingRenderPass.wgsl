struct VSOut {
  @builtin(position) pos : vec4f,
  @location(0) uv : vec2f,
};

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
  var out: VSOut;
  let pos = array<vec2f,6>(
    vec2f(-1.0,-1.0), vec2f( 1.0,-1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f( 1.0,-1.0), vec2f( 1.0, 1.0)
  );
  out.uv = (pos[vid] + vec2f(1.0)) * 0.5;
  out.pos = vec4f(pos[vid].x, -pos[vid].y, 0.0, 1.0);
  return out;
}

// Funkcja ACES tonemap
fn acesTonemap(color: vec3<f32>) -> vec3<f32> {
    let a: f32 = 2.51;
    let b: f32 = 0.03;
    let c: f32 = 2.43;
    let d: f32 = 0.59;
    let e: f32 = 0.14;
    return clamp((color * (a * color + b)) / (color * (c * color + d) + e), vec3<f32>(0.0), vec3<f32>(1.0));
}

// Bindings
@group(0) @binding(0) var sceneTexture : texture_2d<f32>;  // world-space depth / z
@group(0) @binding(1) var screenSampler : sampler;

struct FSOut {
  @location(0) colorOut : vec4f,
};

@fragment
fn fs(vsOut: VSOut) -> FSOut {
  var fsOut: FSOut;
    
  let gamma = 1.0 / 2.3;
  let hdrColor = textureSample(sceneTexture, screenSampler, vsOut.uv).rgb;
  let ldrColor = acesTonemap(hdrColor);
  fsOut.colorOut = vec4f(pow(ldrColor, vec3<f32>(gamma)), 1.0);

  return fsOut;
}
