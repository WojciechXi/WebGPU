struct Uniforms {
  ambientLightColor : vec4f,
};

@group(0) @binding(0) var<uniform> uni : Uniforms;

@vertex
fn vs(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4f {
    var pos = array<vec2f, 6>(
        vec2f(-1.0, -1.0),
        vec2f( 1.0, -1.0),
        vec2f(-1.0,  1.0),
        vec2f(-1.0,  1.0),
        vec2f( 1.0, -1.0),
        vec2f( 1.0,  1.0)
    );

    return vec4f(pos[VertexIndex], 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) fragCoord : vec4f) -> @location(0) vec4f {
    return vec4f(uni.ambientLightColor.rgb, 1.0);
}
