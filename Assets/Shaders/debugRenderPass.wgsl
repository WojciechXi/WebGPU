struct VSOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
    var out: VSOut;

    let pos = array<vec2<f32>,6>(
        vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,-1.0), vec2<f32>(-1.0,1.0),
        vec2<f32>(-1.0,1.0),  vec2<f32>(1.0,-1.0), vec2<f32>(1.0,1.0)
    );
    out.uv = (pos[vid] + vec2<f32>(1.0)) * 0.5;
    out.pos = vec4<f32>(pos[vid].x, -pos[vid].y, 0.0, 1.0);

    return out;
}

@group(0) @binding(0) var texture: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;

@fragment
fn fs_debug(in: VSOut) -> @location(0) vec4<f32> {
    return textureSample(texture, samp, in.uv);
}
