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
  screenSize : vec2f,
};

// Bindings
@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var screenSampler : sampler;
@group(0) @binding(2) var sceneTexture : texture_2d<f32>;

struct FSOut {
  @location(0) colorOut : vec4f,
};

// Funkcja bright pass
fn getBright(color: vec3f) -> vec3f {
    return max(color - vec3f(1), vec3f(0.0));
}

@fragment
fn brightRenderPass(vsOut: VSOut) -> FSOut {
    var fsOut: FSOut;

    let texSize = uniforms.screenSize;
    let hdrColor = textureSample(sceneTexture, screenSampler, vsOut.uv).rgb;
    let bright = getBright(hdrColor);

    fsOut.colorOut = vec4f(bright, 1.0);

    return fsOut;
}

@fragment
fn blurRenderPass(vsOut: VSOut) -> FSOut {
    var fsOut: FSOut;
    let texSize = uniforms.screenSize;
    var sum: vec3f = vec3f(0.0);

    let offsets = array<f32,5>(-50.0, -25.0, 0.0, 25.0, 50.0);
    let weights = array<f32,5>(0.125, 0.25, 0.5, 0.25, 0.125);

    for(var i = 0u; i < 5u; i = i + 1u) {
        let uv = clamp(vsOut.uv + vec2f(offsets[i]/texSize.x, 0.0), vec2f(0.0), vec2f(1.0));
        sum += textureSample(sceneTexture, screenSampler, uv).rgb * weights[i];
    }

    fsOut.colorOut = vec4f(sum, 1.0);
    return fsOut;
}

@fragment
fn bloomRenderPass(vsOut: VSOut) -> FSOut {
    var fsOut: FSOut;
    let texSize = uniforms.screenSize;
    var sum: vec3f = vec3f(0.0);

    let offsets = array<f32,5>(-50.0, -25.0, 0.0, 25.0, 50.0);
    let weights = array<f32,5>(0.125, 0.25, 0.5, 0.25, 0.125);

    for(var i = 0u; i < 5u; i = i + 1u) {
        let uv = clamp(vsOut.uv + vec2f(0.0, offsets[i]/texSize.y), vec2f(0.0), vec2f(1.0));
        sum += textureSample(sceneTexture, screenSampler, uv).rgb * weights[i];
    }

    fsOut.colorOut = vec4f(sum, 1.0);
    return fsOut;
}
