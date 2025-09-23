struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
    var out: VSOut;

    let pos = array<vec2f,6>(
        vec2f(-1.0,-1.0), vec2f(1.0,-1.0), vec2f(-1.0,1.0),
        vec2f(-1.0,1.0),  vec2f(1.0,-1.0), vec2f(1.0,1.0)
    );
    out.uv = (pos[vid] + vec2f(1.0)) * 0.5;
    out.pos = vec4f(pos[vid].x, -pos[vid].y, 0.0, 1.0);

    return out;
}


@group(0) @binding(0) var colorTexture: texture_2d<f32>;
@group(0) @binding(1) var ssaoTexture: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

struct FSOut {
  @location(0) colorOut: vec4f,
};

@fragment
fn fs(vsOut: VSOut) -> FSOut {
    var out: FSOut;

    let color = textureSample(colorTexture, samp, vsOut.uv).rgb;
    let ssao = textureSample(ssaoTexture, samp, vsOut.uv).rgb;

    out.colorOut = vec4f(color * ssao, 1.0);

    return out;
}
