struct Uniforms {
    radius: f32,
    sigmaDepth: f32,
    screenSize: vec2f,
    horizontal: u32,
}

struct VSOut {
  @builtin(position) pos : vec4f,
  @location(0) uv : vec2f,
};

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
  var vsOut: VSOut;

  let pos = array<vec2f,6>(
    vec2f(-1.0,-1.0), vec2f( 1.0,-1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f( 1.0,-1.0), vec2f( 1.0, 1.0)
  );

  vsOut.uv = (pos[vid] + vec2f(1.0)) * 0.5;
  vsOut.pos = vec4f(pos[vid].x, -pos[vid].y, 0.0, 1.0);

  return vsOut;
}

// Bindings
@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var ssaoTexture : texture_2d<f32>; 
@group(0) @binding(2) var screenSampler : sampler;

struct FSOut {
  @location(0) blurOut : vec4f,
};

@fragment
fn fs(vsOut: VSOut) -> FSOut {
    var fsOut: FSOut;

    let radius = uniforms.radius;
    let sigmaDepth = uniforms.sigmaDepth;

    let uvOffset = vec2f(1.0) / uniforms.screenSize;
    let centerDepth = textureSample(ssaoTexture, screenSampler, vsOut.uv).r;

    let isHorizontal = (uniforms.horizontal == 1u);

    var weight: f32 = 0.0;
    var weightSum: f32 = 0.0;
    for (var i = -radius; i <= radius; i += 1) {
        let offset = select(
            vec2f(0.0, f32(i)),     // false
            vec2f(f32(i), 0.0),     // true
            isHorizontal
        );
        
        let sampleUV = vsOut.uv + offset * uvOffset;
        let sample = textureSample(ssaoTexture, screenSampler, sampleUV).r;
        
        // waga bilateralna
        let w = exp(-pow(sample - centerDepth, 2.0) / (2.0 * sigmaDepth * sigmaDepth));
        
        weight += sample * w;
        weightSum += w;
    }
    let blur = weight / weightSum;
    fsOut.blurOut = vec4f(blur, blur, blur, 1.0);

    return fsOut;
}
