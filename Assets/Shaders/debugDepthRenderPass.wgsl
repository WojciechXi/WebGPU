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

@group(0) @binding(0) var depthTexture: texture_depth_2d;
@group(0) @binding(1) var depthSampler: sampler_comparison;

@fragment
fn fs(in: VSOut) -> @location(0) vec4f {
    var depth = textureSampleCompare(depthTexture, depthSampler, in.uv, 0.5);
    return vec4f(depth, 0, 0, 1.0);
}
