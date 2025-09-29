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
@group(0) @binding(0) var screenSampler : sampler;
@group(0) @binding(1) var bloomTexture : texture_2d<f32>;
@group(0) @binding(2) var sceneTexture : texture_2d<f32>;

struct FSOut {
  @location(0) colorOut : vec4f,
};

// Funkcja bright pass
fn getBright(color: vec3f) -> vec3f {
  let brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return select(vec3f(0.0, 0.0, 0.0), color, brightness > 0.5);
}

@fragment
fn brightRenderPass(vsOut: VSOut) -> FSOut {
    var fsOut: FSOut;

    let hdrColor = textureSample(bloomTexture, screenSampler, vsOut.uv).rgb;
    let bright = getBright(hdrColor);

    fsOut.colorOut = vec4f(bright, 1.0);

    return fsOut;
}

@fragment
fn blurRenderPass(vsOut: VSOut) -> FSOut {
    var fsOut: FSOut;

    let texSize = vec2f(textureDimensions(bloomTexture));
    let texOffset = vec2f(1.0 / texSize.x, 1.0 / texSize.y);

    let weights = array<f32,7>(0.2, 0.15, 0.1, 0.05, 0.025, 0.0125, 0.00625);
    var result = textureSample(bloomTexture, screenSampler, vsOut.uv).rgb * weights[0];
    for(var i = 1u; i < 7u; i = i + 1u) {
      result += textureSample(bloomTexture, screenSampler, vsOut.uv + vec2f(texOffset.x * f32(i), 0.0)).rgb * weights[i];
      result += textureSample(bloomTexture, screenSampler, vsOut.uv - vec2f(texOffset.x * f32(i), 0.0)).rgb * weights[i];
    }

    fsOut.colorOut = vec4f(result, 1.0);

    return fsOut;
}

@fragment
fn bloomRenderPass(vsOut: VSOut) -> FSOut {
    var fsOut: FSOut;

    let texSize = vec2f(textureDimensions(bloomTexture));
    let texOffset = vec2f(1.0 / texSize.x, 1.0 / texSize.y);

    let weights = array<f32,7>(0.2, 0.15, 0.1, 0.05, 0.025, 0.0125025, 0.00625);
    var result = textureSample(bloomTexture, screenSampler, vsOut.uv).rgb * weights[0];
    for(var i = 1u; i < 7u; i = i + 1u) {
      result += textureSample(bloomTexture, screenSampler, vsOut.uv + vec2f(0, texOffset.y * f32(i))).rgb * weights[i];
      result += textureSample(bloomTexture, screenSampler, vsOut.uv - vec2f(0, texOffset.y * f32(i))).rgb * weights[i];
    }

    fsOut.colorOut = vec4f(result, 1.0);

    return fsOut;
}

@fragment
fn sceneRenderPass(vsOut: VSOut) -> FSOut {
    var fsOut: FSOut;
    
    let bloom = textureSample(bloomTexture, screenSampler, vsOut.uv);
    let scene = textureSample(sceneTexture, screenSampler, vsOut.uv);

    fsOut.colorOut = vec4f(scene.rgb + bloom.rgb, 1);

    return fsOut;
}
