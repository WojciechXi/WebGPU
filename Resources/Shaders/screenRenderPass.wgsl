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

@group(0) @binding(0) var debugTexture: texture_2d<f32>;
@group(0) @binding(1) var debugSampler: sampler;

@fragment
fn fs(in: VSOut) -> @location(0) vec4f {
    return vec4f(textureSample(debugTexture, debugSampler, in.uv).rgb, 1.0);
}
