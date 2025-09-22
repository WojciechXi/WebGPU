struct VSOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
  var out: VSOut;
  let pos = array<vec2<f32>,6>(
    vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,-1.0), vec2<f32>(-1.0,1.0),
    vec2<f32>(-1.0,1.0),  vec2<f32>(1.0,-1.0), vec2<f32>(1.0,1.0)
  );
  out.uv = (pos[vid] + vec2<f32>(1.0)) * 0.5;
  out.pos = vec4<f32>(pos[vid],0.0,1.0);
  return out;
}

@group(0) @binding(0) var colorTex: texture_2d<f32>;
@group(0) @binding(1) var aoTex: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

// ===== poprawione =====
struct FSOut {
  @location(0) finalColor : vec4<f32>,
};

@fragment fn fs(in: VSOut) -> FSOut {
  let baseColor = textureSample(colorTex,samp,in.uv).rgb;
  let ao = textureSample(aoTex,samp,in.uv).r;

  var out: FSOut;
  out.finalColor = vec4<f32>(baseColor * ao, 1.0);
  return out;
}
