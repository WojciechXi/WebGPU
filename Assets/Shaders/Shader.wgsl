struct Uniforms {
    viewProjectionMatrix: mat4x4f,
    matrix: mat4x4f,
    color: vec4f,
    lightDirection: vec3f,
};

struct Vertex {
    @location(0) position: vec4f,
    @location(1) normal: vec3f,
    @location(2) uv: vec2f,
};

struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) normal: vec3f,
    @location(1) uv: vec2f,
};

@group(0) @binding(0) var<uniform> uni: Uniforms;
@group(0) @binding(1) var myTexture: texture_2d<f32>;
@group(0) @binding(2) var mySampler: sampler;

@vertex fn vs(vert: Vertex) -> VSOutput {
    var vsOut: VSOutput;
    vsOut.position = uni.viewProjectionMatrix * uni.matrix * vert.position;

    let normalMatrix = mat3x3f(
        uni.matrix[0].xyz,
        uni.matrix[1].xyz,
        uni.matrix[2].xyz
    );
    vsOut.normal = normalize(normalMatrix * vert.normal);

    vsOut.uv = vert.uv; // przekazujemy UV do fragment shadera
    return vsOut;
}

@fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
    let normal = normalize(vsOut.normal);
    let light = max(dot(normal, -uni.lightDirection), 0.0);

    // Pobranie koloru z tekstury
    let texColor = textureSample(myTexture, mySampler, vsOut.uv);

    return vec4f(texColor.rgb * light, texColor.a);
}
