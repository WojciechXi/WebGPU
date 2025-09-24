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
@group(0) @binding(1) var clearTexture: texture_2d<f32>;
@group(0) @binding(2) var colorTexture: texture_2d<f32>;
@group(0) @binding(3) var depthLightingTexture: texture_2d<f32>;
@group(0) @binding(4) var forwardTexture: texture_2d<f32>;
@group(0) @binding(5) var depthForwardTexture: texture_2d<f32>;
@group(0) @binding(6) var ssaoTexture: texture_2d<f32>;
@group(0) @binding(7) var samp: sampler;

struct FSOut {
  @location(0) colorOut: vec4f,
};

@fragment
fn fs(vsOut: VSOut) -> FSOut {
  var out: FSOut;

  let screenSize = uni.screenSize;

  let clear = textureSample(clearTexture, samp, vsOut.uv);
  let depthLighting = textureSample(depthLightingTexture, samp, vsOut.uv);
  let depthForward = textureSample(depthForwardTexture, samp, vsOut.uv);

  let ssao = textureSample(ssaoTexture, samp, vsOut.uv).r;
  let lighting = textureSample(colorTexture, samp, vsOut.uv);
  let forward = textureSample(forwardTexture, samp, vsOut.uv);

  var color = vec3f(clear.rgb);
  if(depthLighting.r < 1.0) {
    color = lighting.rgb;

    if(depthForward.r < depthLighting.r) {
      color = mix(color, forward.rgb, forward.a);
    }
  } else if(depthForward.r < 1.0) {
    color = mix(color, forward.rgb, forward.a);
  }

  out.colorOut = vec4f(color * ssao, 1.0);

  return out;
}
