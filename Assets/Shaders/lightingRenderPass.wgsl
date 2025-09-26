fn encodeVector(n: vec3f) -> vec3f {
  return n * 0.5 + vec3f(0.5);
}

fn mat3_from_mat4(m: mat4x4f) -> mat3x3f {
    return mat3x3f(
        m[0].xyz,
        m[1].xyz,
        m[2].xyz
    );
}

fn transpose3(m: mat3x3f) -> mat3x3f {
    return mat3x3f(
        vec3f(m[0][0], m[1][0], m[2][0]),
        vec3f(m[0][1], m[1][1], m[2][1]),
        vec3f(m[0][2], m[1][2], m[2][2])
    );
}

fn inverse3(m: mat3x3f) -> mat3x3f {
    let a = m[0][0]; let b = m[0][1]; let c = m[0][2];
    let d = m[1][0]; let e = m[1][1]; let f = m[1][2];
    let g = m[2][0]; let h = m[2][1]; let i = m[2][2];

    let A =  (e*i - f*h);
    let B = -(d*i - f*g);
    let C =  (d*h - e*g);
    let D = -(b*i - c*h);
    let E =  (a*i - c*g);
    let F = -(a*h - b*g);
    let G =  (b*f - c*e);
    let H = -(a*f - c*d);
    let I =  (a*e - b*d);

    let det = a*A + b*B + c*C;
    let invDet = 1.0 / det;

    return mat3x3f(
        vec3f(A, D, G) * invDet,
        vec3f(B, E, H) * invDet,
        vec3f(C, F, I) * invDet
    );
}

struct Uniforms {
    viewMatrix : mat4x4f,
    projectionMatrix : mat4x4f,
    lightViewMatrix : mat4x4f,
    lightProjectionMatrix : mat4x4f,
    ambientLightColor : vec4f,
    lightColor : vec4f,
};

@group(0) @binding(0) var<uniform> uni : Uniforms;
@group(0) @binding(1) var screenSampler : sampler;
@group(0) @binding(2) var shadowTexture : texture_2d<f32>;
@group(0) @binding(3) var positionTexure : texture_2d<f32>;
@group(0) @binding(4) var normalTexture : texture_2d<f32>;
@group(0) @binding(5) var colorTexture : texture_2d<f32>;
@group(0) @binding(6) var pbrTexture : texture_2d<f32>;

struct VSOut {
  @builtin(position) pos : vec4f,
  @location(0) uv : vec2f,
};

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
  var vsOut: VSOut;
  let pos = array<vec2f,6>(
    vec2f(-1.0,-1.0), vec2f( 1.0,-1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f( 1.0,-1.0), vec2f( 1.0, 1.0)
  );
  vsOut.uv = (pos[vid] + vec2f(1.0)) * 0.5;
  vsOut.pos = vec4f(pos[vid].x, -pos[vid].y, 0.0, 1.0);
  return vsOut;
}

@fragment
fn fs(vsOut: VSOut) -> @location(0) vec4f {
    // Odczyt z G-buffer
    let color = textureSample(colorTexture, screenSampler, vsOut.uv);
    let albedo = color.rgb;
    let emission = albedo * color.a;

    let pbr = textureSample(pbrTexture, screenSampler, vsOut.uv);
    let smoothness = clamp(pbr.r, 0.0, 1.0);
    let metallic = clamp(pbr.g, 0.0, 1.0);
    let ao = clamp(pbr.b, 0.0, 1.0);
    // let ao = clamp(pbr.a, 0.0, 1.0);

    let shadow = textureSample(shadowTexture, screenSampler, vsOut.uv);
    let normalTexture = textureSample(normalTexture, screenSampler, vsOut.uv).xyz;
    let pos_view = textureSample(positionTexure, screenSampler, vsOut.uv).xyz;

    let ambientLightColor = uni.ambientLightColor.rgb * uni.ambientLightColor.a;
    let lightColor = uni.lightColor.rgb * uni.lightColor.a;

    var viewMatrix = uni.viewMatrix;
    viewMatrix[3] = vec4f(0.0, 0.0, 0.0, 1.0);

    let lightDirection = normalize( (viewMatrix * uni.lightViewMatrix * vec4f(0.0, 0.0, 1.0, 0.0)).xyz);

    let N = normalize(normalTexture);
    let L = normalize(-lightDirection);
    let V = normalize(-pos_view);
    let H = normalize(L + V);

    let NdotL = max(dot(N, L), 0.0);

    var diffuse  = albedo * NdotL * ao * (1.0 - metallic);

    let roughness = 1.0 - smoothness;
    let shininess = 1.0 / (roughness * roughness);

    let F0 = mix(vec3f(0.04), albedo, metallic);
    let specularStrength = pow(max(dot(N, H), 0.0), shininess) * NdotL;
    let specular = F0 * specularStrength;

    let ambient = albedo * ambientLightColor * ao;

    return vec4f((diffuse + specular) * lightColor + ambient + emission, 1.0);
}
