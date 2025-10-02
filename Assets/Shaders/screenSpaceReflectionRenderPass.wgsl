struct VSOut {
    @builtin(position) pos : vec4f,
    @location(0) uv : vec2f,
};

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
    var out: VSOut;
    let pos = array<vec2f,6>(
        vec2f(-1.0,-1.0), vec2f( 1.0,-1.0), vec2f(-1.0, 1.0),
        vec2f(-1.0, 1.0), vec2f( 1.0,-1.0), vec2f( 1.0, 1.0)
    );
    out.uv = (pos[vid] + vec2f(1.0)) * 0.5;
    out.pos = vec4f(pos[vid].x, -pos[vid].y, 0.0, 1.0);
    return out;
}

struct Uniforms {
    cameraPosition: vec3f,
    maxDistance: f32,
    stepSize: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var worldPositionTex: texture_2d<f32>;
@group(0) @binding(2) var worldNormalTex: texture_2d<f32>;
@group(0) @binding(3) var sceneTexture: texture_2d<f32>;
@group(0) @binding(4) var screenSampler: sampler;

struct FSOut {
    @location(0) colorOut: vec4f,
};

@fragment
fn fs(vsOut: VSOut) -> FSOut {
    var fsOut: FSOut;

    let screenSize = vec2f(textureDimensions(sceneTexture));
    let maxDistance = 10;// uniforms.maxDistance;
    let stepSize = 0.5;// uniforms.stepSize;

    let uv = vsOut.uv;
    let worldPos = textureSample(worldPositionTex, screenSampler, uv).xyz;
    let worldNormal = normalize(textureSample(worldNormalTex, screenSampler, uv).xyz * 2.0 - 1.0);

    let viewDir = normalize(uniforms.cameraPosition - worldPos);
    let reflectDir = reflect(-viewDir, worldNormal);

    // Project initial position to screen space (NDC)
    var screenUV = uv;
    var reflectionColor = vec3f(0.0);

    // Simple raymarch in screen space
    var t = 0.0;
    var steps = 0u;
    loop {
        if (t > uniforms.maxDistance || steps >= 64u) { break; }
        let offsetUV = screenUV + reflectDir.xy * t / screenSize;
        if (any(offsetUV < vec2f(0.0)) || any(offsetUV > vec2f(1.0))) { break; }

        let samplePos = textureSample(worldPositionTex, screenSampler, offsetUV).xyz;
        let projectedDepth = samplePos.z;

        if (projectedDepth < worldPos.z + t * 0.1) {
            reflectionColor = textureSample(sceneTexture, screenSampler, offsetUV).rgb;
            break;
        }

        t += uniforms.stepSize;
        steps += 1u;
    }

    // Fresnel / blend factor (optional)
    let fresnel = pow(1.0 - max(dot(worldNormal, viewDir), 0.0), 5.0);

    let baseColor = textureSample(sceneTexture, screenSampler, uv).rgb;
    let finalColor = mix(baseColor, reflectionColor, fresnel);

    fsOut.colorOut = vec4f(finalColor, 1.0);
    return fsOut;
}
