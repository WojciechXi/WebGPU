struct VSOut {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f,
};

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
    var out: VSOut;
    let pos = array<vec2f, 6>(
        vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
        vec2f(-1.0,  1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0)
    );

    let p = pos[vid];
    out.pos = vec4f(p, 0.0, 1.0);
    out.uv = vec2f((p.x + 1.0) * 0.5, (1.0 - p.y) * 0.5);
    return out;
}

@group(0) @binding(0) var renderTexture: texture_2d<f32>;

@fragment
fn fs(in: VSOut) -> @location(0) vec4f {
    let texSize = vec2f(textureDimensions(renderTexture));
    let texCoord = vec2i(in.uv * texSize);
    let color = textureLoad(renderTexture, texCoord, 0);
    return vec4f(color.rgb, 1.0);
}