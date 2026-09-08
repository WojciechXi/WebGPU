struct VSOut {
    @builtin(position) pos : vec4f,
    @location(0) uv : vec2f,
};

struct Time {
    time: f32,
    deltaTime: f32,
    frame: u32,
    slot: f32,
};

struct View {
    view: mat4x4f,
    projection: mat4x4f,
    viewProjection: mat4x4f,
    inverseView: mat4x4f,
    inverseProjection: mat4x4f,
    inverseViewProjection: mat4x4f,
};

struct SSGI {
    raysPerPixel: f32,
    maxSteps: f32,
    stepSize: f32,
    thickness: f32,
    bias: f32,
    maxDistance: f32,
    intensity: f32,
    useJitter: f32,
    edgeFade: f32,
    p0: f32,
    p1: f32,
    p2: f32,
};

@group(0) @binding(0) var<uniform> time: Time;
@group(1) @binding(0) var<uniform> view: View;

@group(2) @binding(0) var<uniform> ssgi: SSGI;
@group(2) @binding(1) var samplerPoint : sampler;
@group(2) @binding(2) var depthTexture : texture_depth_2d;
@group(2) @binding(3) var colorTexture : texture_2d<f32>;
@group(2) @binding(4) var worldNormalTexture : texture_2d<f32>;
@group(2) @binding(5) var pbrTexture : texture_2d<f32>;
@group(2) @binding(6) var emissiveTexture: texture_2d<f32>;

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

fn CalculateEdgeFade(uv: vec2<f32>, fadeMargin: f32) -> f32 {
    let edge = min(uv, vec2<f32>(1.0) - uv);
    let dist = min(edge.x, edge.y);
    return saturate(dist / fadeMargin);
}

fn getWorldPos(uv: vec2<f32>, depth: f32) -> vec3<f32> {
    // WebGPU LH: UV [0,1] -> NDC XY [-1,1], Z jest w zakresie [0,1]
    let clipXY = uv * vec2<f32>(2.0, -2.0) + vec2<f32>(-1.0, 1.0);
    let clipPos = vec4<f32>(clipXY, depth, 1.0);
    let worldPos = view.inverseViewProjection * clipPos;
    return worldPos.xyz / worldPos.w;
}

fn getHemisphereVector(normal: vec3<f32>, uv: vec2<f32>, sampleIdx: u32, frame: u32) -> vec3<f32> {
    let seed = u32(uv.x * 1254.0) ^ u32(uv.y * 8732.0) ^ (sampleIdx * 1013u) ^ (frame * 1664525u);
    let r1 = fract(sin(f32(seed) * 0.00001) * 43758.5453);
    let r2 = fract(cos(f32(seed) * 0.00002) * 22578.1459);

    let phi = 2.0 * 3.14159265 * r1;
    let theta = acos(sqrt(1.0 - r2));

    let x = sin(theta) * cos(phi);
    let y = sin(theta) * sin(phi);
    let z = cos(theta);

    var up = vec3<f32>(0.0, 1.0, 0.0);
    if (abs(normal.y) > 0.99) { up = vec3<f32>(0.0, 0.0, 1.0); }
    let tangent = normalize(cross(up, normal));
    let bitangent = cross(normal, tangent);

    return normalize(tangent * x + bitangent * y + normal * z);
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4<f32> {
    let uv = in.uv;

    let rawDepth = textureSampleLevel(depthTexture, samplerPoint, uv, 0);
    if (rawDepth >= 1.0) {
        return vec4<f32>(0.0, 0.0, 0.0, 1.0);
    }

    let worldPos = getWorldPos(uv, rawDepth);
    let normal = normalize(textureSampleLevel(worldNormalTexture, samplerPoint, uv, 0).xyz);
    let albedo = textureSampleLevel(colorTexture, samplerPoint, uv, 0).rgb;

    var indirectLight = vec3<f32>(0.0);
    let raysPerPixel = u32(ssgi.raysPerPixel);
    let maxSteps = i32(ssgi.maxSteps);
    let stepSize = ssgi.stepSize;

    var jitter = 0.0;
    if (ssgi.useJitter > 0.5) {
        let noiseSeed = u32(uv.x * 3214.0) ^ u32(uv.y * 9624.0) ^ (time.frame * 123456u);
        jitter = fract(sin(f32(noiseSeed) * 0.00001) * 43758.5453);
    }

    for (var r = 0u; r < raysPerPixel; r = r + 1u) {
        let rayDir = getHemisphereVector(normal, uv, r, 1);

        // Skalowanie offsetu - im bardziej równoległy promień do powierzchni, tym większy bias
        let NdotD = max(dot(normal, rayDir), 0.001);
        let normalBias = normal * (ssgi.bias / NdotD);
        
        // Startujemy z dodanym jitterem, żeby uniknąć równomiernych pasów
        var rayPos = worldPos + normalBias + rayDir * (stepSize * jitter);

        for (var i = 1; i <= maxSteps; i = i + 1) {
            rayPos += rayDir * stepSize;

            let clipPos = view.viewProjection * vec4<f32>(rayPos, 1.0);
            if (clipPos.w <= 0.0001) { break; }

            let ndc = clipPos.xyz / clipPos.w;
            let sampleUV = vec2<f32>(ndc.x * 0.5 + 0.5, -ndc.y * 0.5 + 0.5);
            let fade = CalculateEdgeFade(sampleUV, ssgi.edgeFade);

            if (fade <= 0.0) {
                break;
            }

            if (sampleUV.x < 0.01 || sampleUV.x > 0.99 || sampleUV.y < 0.01 || sampleUV.y > 0.99) {
                break;
            }

            let sampledDepth = textureSampleLevel(depthTexture, samplerPoint, sampleUV, 0);
            if (sampledDepth >= 1.0) { continue; }

            let sampledWorldPos = getWorldPos(sampleUV, sampledDepth);

            // Left-Handed View Space Z porównanie
            let rayPosViewZ = (view.view * vec4<f32>(rayPos, 1.0)).z;
            let sampledPosViewZ = (view.view * vec4<f32>(sampledWorldPos, 1.0)).z;
            
            let depthDiff = sampledPosViewZ - rayPosViewZ;

            if (rayPosViewZ > ssgi.maxDistance) { break; }

            // Ignorujemy samokolizje na tej samej płaszczyźnie (minimalny proóg zależy od odległości od kamery)
            let minThickness = 0.04 * (1.0 + rayPosViewZ * 0.1);

            if (depthDiff > minThickness && depthDiff < ssgi.thickness) {
                let hitColor = textureSampleLevel(colorTexture, samplerPoint, sampleUV, 0).rgb;
                let hitEmissive = textureSampleLevel(emissiveTexture, samplerPoint, sampleUV, 0).rgb;
                
                let dist = length(sampledWorldPos - worldPos);
                let attenuation = 1.0 / (1.0 + dist * dist);

                indirectLight += (hitEmissive + hitColor) * attenuation * fade; 
                break;
            }
        }
    }

    let finalGI = (indirectLight / f32(raysPerPixel)) * albedo * ssgi.intensity;
    return vec4<f32>(finalGI, 1.0);
}