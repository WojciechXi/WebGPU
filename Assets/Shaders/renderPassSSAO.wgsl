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

struct SSAOUniforms {
  radius  : f32,
  bias    : f32,
  screenSize : vec2f,
  matrix : mat4x4f,
  samples : array<vec4f, 64>,
};

// Bindings
@group(0) @binding(0) var<uniform> uni : SSAOUniforms;
@group(0) @binding(1) var positionTexture : texture_2d<f32>;  // world-space depth / z
@group(0) @binding(2) var normalTexture : texture_2d<f32>; // world-space normal
@group(0) @binding(3) var samp : sampler;
@group(0) @binding(4) var noiseTexture : texture_2d<f32>;
@group(0) @binding(5) var noiseSampler : sampler;

struct FSOut {
  @location(0) aoOut : vec4f,
};

@fragment
fn fs(vsOut: VSOut) -> FSOut {
  var fsOut: FSOut;
  let uv = vsOut.uv;

  // --- noise ---
  let noiseScale = uni.screenSize / 4;
  let noiseUV = fract(uv * noiseScale);

  // --- gotowa pozycja z positionTexture ---
  let sampleDepth = textureSample(positionTexture, samp, uv).z;

  let fragPos = textureSample(positionTexture, samp, uv).rgb;
  let normal = normalize(textureSample(normalTexture, samp, uv).rgb);
  let random = textureSample(noiseTexture, noiseSampler, noiseUV).xyz;
  let noise = normalize(random);

  // --- TBN ---
  let tangent = normalize(noise - normal * dot(noise, normal));
  let bitangent = cross(normal, tangent);
  let TBN = mat3x3f(tangent, bitangent, normal);

  // --- SSAO kernel ---
  var occlusion : f32 = 0.0;
  for (var i = 0u; i < 64u; i++) {
      var samplePos = TBN * uni.samples[i].xyz;
      samplePos = fragPos + samplePos * uni.radius;

      var offset = uni.matrix * vec4f(samplePos, 1.0);
      var offset3 = offset.xyz / offset.w;
      offset3 = offset3 * 0.5 + 0.5;
      offset3.y = -offset3.y;

      let sampleDepth = textureSample(positionTexture, samp, offset3.xy).z; 

      let rangeCheck = smoothstep(0.0, 1.0, uni.radius / abs(fragPos.z - sampleDepth));
      occlusion += select(0.0, 1.0, sampleDepth >= samplePos.z + uni.bias) * rangeCheck;
  }

  occlusion = 1.0 - (occlusion / 64.0);
  fsOut.aoOut = vec4f(occlusion, 0, 0, 1.0);

  return fsOut;
}
