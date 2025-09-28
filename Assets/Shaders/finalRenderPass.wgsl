struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
    var out: VSOut;

    let pos = array<vec2f,6>(
        vec2f(-1.0,-1.0), vec2f(1.0,-1.0), vec2f(-1.0,1.0),
        vec2f(-1.0,1.0),  vec2f(1.0,-1.0), vec2f(1.0,1.0)
    );
    out.uv = (pos[vid] + vec2f(1.0)) * 0.5;
    out.pos = vec4f(pos[vid].x, -pos[vid].y, 0.0, 1.0);

    return out;
}

struct FinalUniforms {
  screenSize : vec2f,
};

@group(0) @binding(0) var<uniform> uni : FinalUniforms;
@group(0) @binding(1) var screenSampler: sampler;
@group(0) @binding(2) var clearTexture: texture_2d<f32>;
@group(0) @binding(3) var lightingTexture: texture_2d<f32>;
@group(0) @binding(4) var depthTexture: texture_2d<f32>;
@group(0) @binding(5) var forwardTexture: texture_2d<f32>;
@group(0) @binding(6) var depthForwardTexture: texture_2d<f32>;

struct FSOut {
  @location(0) colorOut: vec4f,
};

@fragment
fn fs(vsOut: VSOut) -> FSOut {
  var out: FSOut;

  let screenSize = uni.screenSize;

  let clear = textureSample(clearTexture, screenSampler, vsOut.uv);
  let depth = textureSample(depthTexture, screenSampler, vsOut.uv);
  let depthForward = textureSample(depthForwardTexture, screenSampler, vsOut.uv);

  let lighting = textureSample(lightingTexture, screenSampler, vsOut.uv);
  let forward = textureSample(forwardTexture, screenSampler, vsOut.uv);

  var color = lighting.rgb;
  if(depth.w <= 0) {
    color = vec3f(clear.rgb);
  }

  out.colorOut = vec4f(color, 1.0);

  return out;
}
