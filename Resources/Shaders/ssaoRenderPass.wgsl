struct VSOut {
    @builtin(position) pos : vec4f,
    @location(0) uv : vec2f,
};

struct View {
    view: mat4x4f,
    projection: mat4x4f,
    viewProjection: mat4x4f,
    inverseView: mat4x4f,
    inverseProjection: mat4x4f,
    inverseViewProjection: mat4x4f,
};

struct SSAO {
    radius: f32,
    bias: f32,
    intensity: f32,
    sampleCount: f32,
};

@group(0) @binding(0) var<uniform> view: View;

@group(1) @binding(0) var<uniform> ssao: SSAO;
@group(1) @binding(1) var samplerPoint : sampler;
@group(1) @binding(2) var depthTexture : texture_depth_2d;
@group(1) @binding(3) var worldNormalTexture : texture_2d<f32>;

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

fn getWorldPos(uv: vec2<f32>, depth: f32) -> vec3<f32> {
    let clipXY = uv * vec2<f32>(2.0, -2.0) + vec2<f32>(-1.0, 1.0);
    let clipPos = vec4<f32>(clipXY, depth, 1.0);
    let worldPos = view.inverseViewProjection * clipPos;
    return worldPos.xyz / worldPos.w;
}

fn getSampleOffset(sampleIdx: u32, totalSamples: u32, uv: vec2<f32>) -> vec3<f32> {
    let seed = u32(uv.x * 1254.0) ^ u32(uv.y * 8732.0) ^ (sampleIdx * 1013u);
    let r1 = fract(sin(f32(seed) * 0.00001) * 43758.5453);
    let r2 = fract(cos(f32(seed) * 0.00002) * 22578.1459);

    let phi = 2.0 * 3.14159265 * r1;
    let cosTheta = 1.0 - r2;
    let sinTheta = sqrt(max(0.0, 1.0 - cosTheta * cosTheta));

    var dir = vec3<f32>(sinTheta * cos(phi), sinTheta * sin(phi), cosTheta);
    
    var scale = f32(sampleIdx) / f32(totalSamples);
    scale = mix(0.1, 1.0, scale * scale);
    
    return dir * scale;
}

@fragment
fn fs(in: VSOut) -> @location(0) f32 {
    let uv = in.uv;

    let rawDepth = textureSampleLevel(depthTexture, samplerPoint, uv, 0);
    if (rawDepth >= 1.0) {
        return 1.0;
    }

    let worldPos = getWorldPos(uv, rawDepth);
    let normal = normalize(textureSampleLevel(worldNormalTexture, samplerPoint, uv, 0).xyz * 2.0 - 1.0);

    let viewPos = (view.view * vec4<f32>(worldPos, 1.0)).xyz;
    let viewNormal = normalize((view.view * vec4<f32>(normal, 0.0)).xyz);

    var up = vec3<f32>(0.0, 1.0, 0.0);
    if (abs(viewNormal.y) > 0.99) { up = vec3<f32>(0.0, 0.0, 1.0); }
    let tangent = normalize(cross(up, viewNormal));
    let bitangent = cross(viewNormal, tangent);
    let tbn = mat3x3<f32>(tangent, bitangent, viewNormal);

    var occlusion = 0.0;
    let sampleCount = u32(ssao.sampleCount);

    for (var i = 0u; i < sampleCount; i = i + 1u) {
        let sampleOffset = tbn * getSampleOffset(i, sampleCount, uv);
        let samplePosView = viewPos + sampleOffset * ssao.radius;

        let clipPos = view.projection * vec4<f32>(samplePosView, 1.0);
        if (clipPos.w <= 0.0001) { continue; }

        let ndc = clipPos.xyz / clipPos.w;
        let sampleUV = vec2<f32>(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5);

        if (sampleUV.x < 0.0 || sampleUV.x > 1.0 || sampleUV.y < 0.0 || sampleUV.y > 1.0) {
            continue;
        }

        let realDepth = textureSampleLevel(depthTexture, samplerPoint, sampleUV, 0);
        let realWorldPos = getWorldPos(sampleUV, realDepth);
        let realViewZ = (view.view * vec4<f32>(realWorldPos, 1.0)).z;

        let depthDiff = samplePosView.z - realViewZ;
        if (depthDiff >= ssao.bias) {
            let rangeCheck = smoothstep(1.0, 0.0, depthDiff / ssao.radius);
            occlusion += rangeCheck;
        }
    }

    let ao = 1.0 - (occlusion / f32(sampleCount)) * ssao.intensity;
    return max(0.0, ao);
}