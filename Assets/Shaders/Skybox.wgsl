struct Uniforms {
    viewProjectionMatrix : mat4x4<f32>,
    viewProjectionInverseMatrix : mat4x4<f32>,
    matrix : mat4x4<f32>,

    lightDirection : vec3<f32>,
    lightColor : vec4<f32>,
    ambientLightColor : vec4<f32>,

    color : vec4<f32>,
};

struct VSOutput {
    @builtin(position) position: vec4f,
};

@group(0) @binding(0) var<uniform> uni: Uniforms;
@group(0) @binding(1) var ourSampler: sampler;
@group(0) @binding(2) var ourTexture: texture_2d<f32>;

@vertex
fn vs(@builtin(vertex_index) vNdx: u32) -> VSOutput {
    var vsOut: VSOutput;

    // fullscreen triangle w clip space
    let pos = array<vec2f, 3>(
        vec2f(-1.0, -1.0),
        vec2f( 3.0, -1.0),
        vec2f(-1.0,  3.0)
    );

    vsOut.position = vec4f(pos[vNdx], 0.0, 1.0);
    return vsOut;
}

@fragment
fn fs(vsOut: VSOutput) -> @location(0) vec4f {
    let ndc = vec4f(vsOut.position.xy, 0.0, 1.0); // z = 0 dla near plane
    var dir = (uni.viewProjectionInverseMatrix * ndc).xyz;
    dir = normalize(dir);

    // Konwersja do UV dla equirectangular mapy
    let u = 0.5 + atan2(dir.z, dir.x) / (2.0 * 3.14159265);
    let v = 0.5 - asin(dir.y) / 3.14159265;

    let texColor = textureSample(ourTexture, ourSampler, vec2f(u, v));
    return vec4f(uni.color.rgb * uni.color.a, 1);
}