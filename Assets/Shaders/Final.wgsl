struct VSOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
    var out: VSOut;
    let pos = array<vec2<f32>,6>(
        vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,-1.0), vec2<f32>(-1.0,1.0),
        vec2<f32>(-1.0,1.0), vec2<f32>(1.0,-1.0), vec2<f32>(1.0,1.0)
    );
    out.uv = (pos[vid] + vec2<f32>(1.0)) * 0.5;
    out.pos = vec4<f32>(pos[vid].x, -pos[vid].y, 0.0, 1.0);
    return out;
}


@group(0) @binding(0) var positionTexture: texture_2d<f32>;
@group(0) @binding(1) var normalTexture: texture_2d<f32>;
@group(0) @binding(2) var colorTexture: texture_2d<f32>;
@group(0) @binding(3) var ssaoTexture: texture_2d<f32>;
@group(0) @binding(4) var samp: sampler;

struct FSOut {
  @location(0) finalColor: vec4<f32>,
};

@fragment
fn fs(in: VSOut) -> FSOut {
    var out: FSOut;

    let position = textureSample(positionTexture, samp, in.uv).rgb;
    let normal = textureSample(normalTexture, samp, in.uv).rgb;
    let color = textureSample(colorTexture, samp, in.uv).rgb;
    let ssao = textureSample(ssaoTexture, samp, in.uv).rgb;

    out.finalColor = vec4<f32>(color * ssao, 1.0);

    return out;
}
