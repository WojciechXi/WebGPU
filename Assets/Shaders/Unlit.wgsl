struct Uniforms {
    viewProjectionMatrix : mat4x4<f32>,
    viewProjectionInverseMatrix : mat4x4<f32>,
    matrix : mat4x4<f32>,

    lightDirection : vec3<f32>,
    lightColor : vec4<f32>,
    ambientLightColor : vec4<f32>,

    color : vec4<f32>,
};

struct Vertex {
    @location(0) position: vec4f,
    @location(1) normal: vec3f,
    @location(2) color: vec3f,
    @location(3) uv: vec2f,
};

@group(0) @binding(0) var<uniform> uni : Uniforms;
@group(0) @binding(1) var ourSampler: sampler;
@group(0) @binding(2) var ourTexture: texture_2d<f32>;

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) normal: vec3f,
    @location(1) uv: vec2f,
};

@vertex
fn vs(vert: Vertex) -> VSOut {
  var vsOut: VSOut;
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

struct FSOut {
  @location(0) colorOut : vec4<f32>,
};

@fragment
fn fs(vsOut: VSOut) -> FSOut {
    var fsOut: FSOut;

    let normal = normalize(vsOut.normal);
    
    let diffuse = max(dot(normal, -uni.lightDirection), 0.0);

    let lightColor = uni.lightColor.rgb * uni.lightColor.a;
    let ambient = uni.ambientLightColor.rgb * uni.ambientLightColor.a;

    let texColor = textureSample(ourTexture, ourSampler, vsOut.uv);

    let finalColor = (ambient + diffuse * lightColor) * uni.color.rgb * texColor.rgb;
    let alpha = texColor.a * uni.color.a;

    fsOut.colorOut = vec4f(finalColor, alpha);

    return fsOut;
}
