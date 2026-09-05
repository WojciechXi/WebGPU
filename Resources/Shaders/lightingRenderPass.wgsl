@group(0) @binding(0) var<uniform> view : View;
@group(1) @binding(0) var<uniform> directionalLight : DirectionalLight;
@group(2) @binding(0) var<uniform> ambientLight : AmbientLight;

@group(3) @binding(0) var gSampler : sampler;
@group(3) @binding(1) var gDepth : texture_depth_2d;
@group(3) @binding(2) var gColor : texture_2d<f32>;
@group(3) @binding(3) var gNormal : texture_2d<f32>;
@group(3) @binding(4) var gPbr : texture_2d<f32>;
@group(3) @binding(5) var gEmissive : texture_2d<f32>;

struct View {
    matrix : mat4x4f,
    projection : mat4x4f,
    viewProjection : mat4x4f,
    inverseView : mat4x4f,
    inverseViewProjection : mat4x4f,
};

struct DirectionalLight {
    matrix : mat4x4f,
    projection : mat4x4f,
    viewProjection : mat4x4f,
    inverseView : mat4x4f,
    inverseViewProjection : mat4x4f,
    color : vec4f,
    shadowColor : vec4f,
    shadowBias: f32,
    shadowRadius: f32,
};

struct AmbientLight {
    color : vec4f,
};

const PI = 3.14159265359;

// Rekonstrukcja World Position z bufora głębi
fn reconstructWorldPosition(uv: vec2f, depth: f32) -> vec3f {
    let clipX = uv.x * 2.0 - 1.0;
    let clipY = (1.0 - uv.y) * 2.0 - 1.0; 
    let clipPos = vec4f(clipX, clipY, depth, 1.0);

    let worldPosAddress = view.inverseViewProjection * clipPos;
    return worldPosAddress.xyz / worldPosAddress.w;
}

// --- PBR Cook-Torrance BRDF ---

fn distributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;

    let num = a2;
    let denom = (NdotH2 * (a2 - 1.0) + 1.0);
    return num / (PI * denom * denom);
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r = (roughness + 1.0);
    let k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

fn geometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    let ggx2 = geometrySchlickGGX(NdotV, roughness);
    let ggx1 = geometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
}

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

struct VertexOut {
    @builtin(position) pos : vec4f,
    @location(0) uv : vec2f,
};

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VertexOut {
    var vertexOut: VertexOut;
    let pos = array<vec2f,6>(
        vec2f(-1.0,-1.0), vec2f( 1.0,-1.0), vec2f(-1.0, 1.0),
        vec2f(-1.0, 1.0), vec2f( 1.0,-1.0), vec2f( 1.0, 1.0)
    );

    vertexOut.uv = (pos[vid] + vec2f(1.0)) * 0.5;
    vertexOut.pos = vec4f(pos[vid].x, -pos[vid].y, 0.0, 1.0);

    return vertexOut;
}

@fragment
fn fs(@location(0) uv: vec2f) -> @location(0) vec4f {
    let depth = textureSample(gDepth, gSampler, uv);
    
    if (depth >= 1.0) {
        discard;
    }

    let worldPos = reconstructWorldPosition(uv, depth);

    // Próbkowanie G-Buffera
    let albedo   = textureSample(gColor, gSampler, uv).rgb;
    let rawNorm  = textureSample(gNormal, gSampler, uv).rgb;
    let pbr      = textureSample(gPbr, gSampler, uv);
    let emissive = textureSample(gEmissive, gSampler, uv).rgb;

    // Przeliczenie normalki z [0, 1] do [-1, 1]
    let N = normalize(rawNorm * 2.0 - 1.0);
    
    // Pozycja kamery z inverseView (ostatnia kolumna to pozycja kamery w świecie)
    let cameraPos = view.inverseView[3].xyz;
    let V = normalize(cameraPos - worldPos);

    let roughness = clamp(pbr.r, 0.05, 1.0);
    let metallic  = pbr.g;
    let occlusion = pbr.b;

    var F0 = vec3f(0.04);
    F0 = mix(F0, albedo, metallic);

    // --- Światło Kierunkowe (Directional Light) ---
    // Pobranie kierunku z macierzy światła (np. kierunek patrzenia macierzy directionalLight.matrix)
    let L = normalize(-directionalLight.matrix[2].xyz); 
    let H = normalize(V + L);
    let NdotL = max(dot(N, L), 0.0);

    let NDF = distributionGGX(N, H, roughness);
    let G   = geometrySmith(N, V, L, roughness);
    let F   = fresnelSchlick(max(dot(H, V), 0.0), F0);

    let numerator   = NDF * G * F;
    let denominator = 4.0 * max(dot(N, V), 0.0) * NdotL + 0.0001;
    let specular    = numerator / denominator;

    let kS = F;
    var kD = vec3f(1.0) - kS;
    kD *= 1.0 - metallic;

    let lightRadiance = directionalLight.color.rgb * directionalLight.color.a;
    let directDiffuseSpecular = (kD * albedo / PI + specular) * lightRadiance * NdotL;

    // --- Światło Otoczenia (Ambient) ---
    let ambient = ambientLight.color.rgb * albedo * occlusion;

    // Wynikowe światło
    let finalColor = ambient + directDiffuseSpecular + emissive;

    return vec4f(finalColor, 1.0);
}