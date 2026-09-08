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

@group(0) @binding(0) var<uniform> view: View;

@group(1) @binding(0) var samplerPoint : sampler;
@group(1) @binding(1) var ssgiTexture : texture_2d<f32>; // Tekstura po rozmyciu poziomym (0.5x)
@group(1) @binding(2) var depthTexture : texture_depth_2d; // Pełnowymiarowa głębokość (1.0x)
@group(1) @binding(3) var worldNormalTexture : texture_2d<f32>; // Pełnowymiarowe normalne (1.0x)

struct VSOut {
  @builtin(position) pos : vec4f,
  @location(0) uv : vec2f,
};

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
    var vertex_index: VSOut;
    let pos = array<vec2f,6>(
        vec2f(-1.0,-1.0), vec2f( 1.0,-1.0), vec2f(-1.0, 1.0),
        vec2f(-1.0, 1.0), vec2f( 1.0,-1.0), vec2f( 1.0, 1.0)
    );

    vertex_index.uv = (pos[vid] + vec2f(1.0)) * 0.5;
    vertex_index.pos = vec4f(pos[vid].x, -pos[vid].y, 0.0, 1.0);

    return vertex_index;
}

fn linearizeDepth(depth: f32) -> f32 {
    let clipXY = vec2<f32>(0.0);
    let clipPos = vec4<f32>(clipXY, depth, 1.0);
    let worldPos = view.inverseViewProjection * clipPos;
    return (view.view * vec4<f32>(worldPos.xyz / worldPos.w, 1.0)).z;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4<f32> {
    let uv = in.uv;
    let texSize = vec2<f32>(textureDimensions(ssgiTexture));
    let texelSize = vec2<f32>(0.0, 1.0 / texSize.y); // Offset tylko w osi Y

    // Pobieramy wzorcowe właściwości geometrii z buforów w PEŁNEJ rozdzielczości (1.0x)
    let centerDepth = linearizeDepth(textureSampleLevel(depthTexture, samplerPoint, uv, 0));
    let centerNormal = normalize(textureSampleLevel(worldNormalTexture, samplerPoint, uv, 0).xyz);

    var totalColor = vec3<f32>(0.0);
    var totalWeight = 0.0001;

    let weights = array<f32, 4>(0.26, 0.16, 0.07, 0.01);

    // Próbkowanie punktu centralnego
    let centerColor = textureSampleLevel(ssgiTexture, samplerPoint, uv, 0).rgb;
    totalColor += centerColor * 0.38;
    totalWeight += 0.38;

    for (var i = 1; i <= 4; i = i + 1) {
        let offset = vec2<f32>(f32(i)) * texelSize;

        let uvP = uv + offset;
        let uvN = uv - offset;

        // --- Próbka P ---
        let depthP = linearizeDepth(textureSampleLevel(depthTexture, samplerPoint, uvP, 0));
        let normalP = normalize(textureSampleLevel(worldNormalTexture, samplerPoint, uvP, 0).xyz);
        let colorP = textureSampleLevel(ssgiTexture, samplerPoint, uvP, 0).rgb;

        let depthWeightP = exp(-abs(centerDepth - depthP) * 10.0);
        let normalWeightP = pow(max(0.0, dot(centerNormal, normalP)), 16.0);
        let weightP = weights[i - 1] * depthWeightP * normalWeightP;

        totalColor += colorP * weightP;
        totalWeight += weightP;

        // --- Próbka N ---
        let depthN = linearizeDepth(textureSampleLevel(depthTexture, samplerPoint, uvN, 0));
        let normalN = normalize(textureSampleLevel(worldNormalTexture, samplerPoint, uvN, 0).xyz);
        let colorN = textureSampleLevel(ssgiTexture, samplerPoint, uvN, 0).rgb;

        let depthWeightN = exp(-abs(centerDepth - depthN) * 10.0);
        let normalWeightN = pow(max(0.0, dot(centerNormal, normalN)), 16.0);
        let weightN = weights[i - 1] * depthWeightN * normalWeightN;

        totalColor += colorN * weightN;
        totalWeight += weightN;
    }

    return vec4<f32>(totalColor / totalWeight, 1.0);
}