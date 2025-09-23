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

// Bindings
@group(0) @binding(0) var positionTexture : texture_2d<f32>; // view-space position
@group(0) @binding(1) var normalTexture   : texture_2d<f32>; // view-space normal
@group(0) @binding(2) var samp            : sampler;

struct SSAOUniforms {
  radius  : f32,
  bias    : f32,
  samples : array<vec4f, 32>,
};
@group(0) @binding(3) var<uniform> ssaoUni : SSAOUniforms;

struct FSOut {
  @location(0) aoOut : vec4f,
};

@fragment
fn fs(input: VSOut) -> FSOut {
  let fragPos = textureSample(positionTexture, samp, input.uv).xyz;
  var normal  = normalize(textureSample(normalTexture, samp, input.uv).xyz);

  var occlusion = 0.0;

  // TBN dla view-space
  var up: vec3f;
  if (abs(normal.z) < 0.999) {
      up = vec3f(0.0,0.0,1.0);
  } else {
      up = vec3f(1.0,0.0,0.0);
  }
  let tangent   = normalize(cross(up, normal));
  let bitangent = cross(normal, tangent);
  let TBN = mat3x3f(tangent, bitangent, normal);

  for (var i = 0u; i < 32u; i = i + 1u) {
    let sampleVec = ssaoUni.samples[i].xyz;

    // próbka w view-space
    let samplePos = fragPos + TBN * sampleVec * ssaoUni.radius;

    // rzutowanie próbki do UV tekstury
    let offset = vec2f(0.5) + vec2f(samplePos.x / samplePos.z, samplePos.y / samplePos.z) * 0.5;
    if (offset.x >= 0.0 && offset.x <= 1.0 && offset.y >= 0.0 && offset.y <= 1.0) {
      let sampleDepth = textureSample(positionTexture, samp, offset).z;
      if (sampleDepth >= samplePos.z - ssaoUni.bias) {
        occlusion += 1.0;
      }
    }
  }

  occlusion = 1.0 - (occlusion / 32.0);

  var out: FSOut;
  out.aoOut = vec4f(occlusion, occlusion, occlusion, 1.0);
  return out;
}
