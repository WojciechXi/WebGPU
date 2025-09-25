struct Uniforms {
    ambientLightColor : vec4<f32>,
    lightColor : vec4<f32>,
    lightDirection : vec3<f32>,
};

@group(0) @binding(0) var<uniform> uni : Uniforms;
@group(0) @binding(1) var shadowTexture : texture_2d<f32>;
@group(0) @binding(2) var positionTexure : texture_2d<f32>;
@group(0) @binding(3) var normalTexture : texture_2d<f32>;
@group(0) @binding(4) var colorTexture : texture_2d<f32>;
@group(0) @binding(5) var pbrTexture : texture_2d<f32>;

@vertex
fn vs(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4<f32> {
    var pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>( 1.0, -1.0),
        vec2<f32>(-1.0,  1.0),
        vec2<f32>(-1.0,  1.0),
        vec2<f32>( 1.0, -1.0),
        vec2<f32>( 1.0,  1.0)
    );

    return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) fragCoord : vec4<f32>) -> @location(0) vec4<f32> {
    // Odczyt z G-buffer
    let shadow = textureLoad(shadowTexture, vec2<i32>(fragCoord.xy), 0);
    let albedo = textureLoad(colorTexture, vec2<i32>(fragCoord.xy), 0).rgb;
    let normal = textureLoad(normalTexture, vec2<i32>(fragCoord.xy), 0).xyz;
    let pos_view = textureLoad(positionTexure, vec2<i32>(fragCoord.xy), 0).xyz;
    let pbr = textureLoad(pbrTexture, vec2<i32>(fragCoord.xy), 0).rgb;

    let N = normalize(normal);
    let L = normalize(-uni.lightDirection);
    let V = normalize(-pos_view);
    let H = normalize(L + V);

    let NdotL = max(dot(N, L), 0.0);
    let diffuse  = albedo * NdotL;
    
    let roughness = clamp(pbr.g, 0.05, 1.0);
    let shininess = 1.0 / (roughness * roughness);
    let specular  = pow(max(dot(N, H), 0.0), shininess);

    let ambientLightColor = uni.ambientLightColor.rgb * uni.ambientLightColor.a;
    let lightColor = uni.lightColor.rgb * uni.lightColor.a;

    let color = (diffuse + specular) * (lightColor) + albedo * ambientLightColor;

    return vec4<f32>(color, 1.0);
}
