struct Uniforms {
    viewProjectionMatrix: mat4x4f,
    matrix: mat4x4f,
    color: vec4f,
    lightDirection: vec3f,
    lightColor: vec4f,
    ambientLightColor: vec4f,
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
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var myTexture: texture_2d<f32>;

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
    
    let diffuse = max(dot(normal, -uni.lightDirection), 0.0);

    let lightColor = uni.lightColor.rgb * uni.lightColor.a;
    let ambient = uni.ambientLightColor.rgb * uni.ambientLightColor.a;

    let texColor = textureSample(myTexture, mySampler, vsOut.uv);

    let finalColor = (ambient + diffuse * lightColor) * uni.color.rgb * texColor.rgb;

    return vec4f(finalColor, texColor.a);
}
