struct VSOut {
    @builtin(position) pos : vec4f,
    @location(0) uv : vec2f,
};

@group(0) @binding(0) var samplerPoint : sampler;
@group(0) @binding(1) var colorRenderTexture : texture_2d<f32>;
@group(0) @binding(2) var lightingRenderTexture : texture_2d<f32>;
@group(0) @binding(3) var ssaoRenderTexture : texture_2d<f32>;
@group(0) @binding(4) var ssgiRenderTexture: texture_2d<f32>;

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
    var out: VSOut;
    let pos = array<vec2f,6>(
        vec2f(-1.0,-1.0), vec2f( 1.0,-1.0), vec2f(-1.0, 1.0),
        vec2f(-1.0, 1.0), vec2f( 1.0,-1.0), vec2f( 1.0, 1.0)
    );

    out.uv = (pos[vid] * vec2f(1.0, -1.0) + vec2f(1.0)) * 0.5;
    out.pos = vec4f(pos[vid], 0.0, 1.0);
    return out;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4<f32> {
    let uv = in.uv;

    let albedo = textureSampleLevel(colorRenderTexture, samplerPoint, uv, 0).rgb;
    let directLighting = textureSampleLevel(lightingRenderTexture, samplerPoint, uv, 0).rgb;
    let ao = textureSampleLevel(ssaoRenderTexture, samplerPoint, uv, 0).r;
    let indirectLighting = textureSampleLevel(ssgiRenderTexture, samplerPoint, uv, 0).rgb;

    let ambientColor = vec3<f32>(0.03, 0.03, 0.04);
    let ambient = albedo * ambientColor * ao;

    let indirect = indirectLighting * albedo * ao;

    let direct = directLighting;

    let finalColor = direct + indirect + ambient;

    return vec4<f32>(finalColor, 1.0);
}