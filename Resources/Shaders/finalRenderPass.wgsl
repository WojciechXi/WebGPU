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

struct Screen {
  size : vec2f,
};

@group(0) @binding(0) var<uniform> screen : Screen;
@group(0) @binding(1) var screenSampler: sampler;
@group(0) @binding(2) var depthSampler: sampler;
@group(0) @binding(3) var clearTexture: texture_2d<f32>;
@group(0) @binding(4) var lightingTexture: texture_2d<f32>;
@group(0) @binding(5) var depthTexture: texture_2d<f32>;

struct FSOut {
  @location(0) colorOut: vec4f,
};

@fragment
fn fs(vsOut: VSOut) -> FSOut {
  var out: FSOut;

  let screenSize = screen.size;

  let clear = textureSample(clearTexture, screenSampler, vsOut.uv);

  let depth = textureSample(depthTexture, depthSampler, vsOut.uv);

  let lighting = textureSample(lightingTexture, screenSampler, vsOut.uv);

  var color = lighting.rgb;
  if(depth.r >= 1) {
    color = vec3f(clear.rgb);
  }

  out.colorOut = vec4f(color, 1.0);

  return out;
}
