fn acesFitted(color: vec3f) -> vec3f {
  let m1 = mat3x3f(
    0.59719, 0.07600, 0.02840,
    0.35458, 0.90834, 0.13383,
    0.04823, 0.01566, 0.83777
  );
  let m2 = mat3x3f(
    1.60475, -0.10208, -0.00327,
    -0.53108,  1.10813, -0.07276,
    -0.07367, -0.00605,  1.07602
  );
  
  var v = m1 * color;
  let a = v * (v + 0.0245786) - 0.000090537;
  let b = v * (0.983729 * v + 0.432951) + 0.238081;
  v = a / b;
  return clamp(m2 * v, vec3f(0.0), vec3f(1.0));
}

struct Params {
  exposure : f32,
  gamma : f32,
};

@group(0) @binding(0) var screenSampler : sampler;
@group(0) @binding(1) var<uniform> params : Params;
@group(0) @binding(2) var sceneTexture : texture_2d<f32>;

struct VSOut {
  @builtin(position) pos : vec4f,
  @location(0) uv : vec2f,
};

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
    var vertex_index: VSOut;
    let pos = array<vec2f,6>(
        vec2f(-1.0,-1.0), vec2f( 1.0,-1.0), vec2f(-1.0, 1.0),
        vec2f(-1.0, 1.0), vec2f( 1.0,-1.0), vec2f( 1.0, 1.0)
    );

    vertex_index.uv = (pos[vid] + vec2f(1.0)) * 0.5;
    vertex_index.pos = vec4f(pos[vid].x, -pos[vid].y, 0.0, 1.0);

    return vertex_index;
}

struct FSOut {
  @location(0) colorOut : vec4f,
};

@fragment
fn fs(vsOut: VSOut) -> FSOut {
  var fsOut: FSOut;

  let rawHdr = textureSample(sceneTexture, screenSampler, vsOut.uv).rgb;

  let hdrColor = rawHdr * params.exposure;

  // 2. Tonemapping ACES
  let ldrColor = acesFitted(hdrColor);

  let applyLinearToSrgb = true; 
  if (applyLinearToSrgb) {
    let gamma = 1.0 / params.gamma;
    fsOut.colorOut = vec4f(pow(ldrColor, vec3f(gamma)), 1.0);
  } else {
    fsOut.colorOut = vec4f(ldrColor, 1.0);
  }

  return fsOut;
}