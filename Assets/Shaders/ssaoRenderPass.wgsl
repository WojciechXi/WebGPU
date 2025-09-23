struct VSOut {
  @builtin(position) pos : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
  var out: VSOut;
  let pos = array<vec2<f32>,6>(
    vec2<f32>(-1.0,-1.0), vec2<f32>( 1.0,-1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>( 1.0,-1.0), vec2<f32>( 1.0, 1.0)
  );
  out.uv = (pos[vid] + vec2<f32>(1.0)) * 0.5;
  out.pos = vec4<f32>(pos[vid].x, -pos[vid].y, 0.0, 1.0);
  return out;
}

@group(0) @binding(0) var positionTexture : texture_2d<f32>;
@group(0) @binding(1) var normalTexture   : texture_2d<f32>;
@group(0) @binding(2) var samp            : sampler;

struct SSAOUniforms {
  viewProjectionInverse : mat4x4<f32>, // do rekonstrukcji view-space z NDC
  samples : array<vec4<f32>, 32>,
};
@group(0) @binding(3) var<uniform> ssaoUni : SSAOUniforms;

struct FSOut {
  @location(0) aoOut : vec4<f32>,
};

@fragment
fn fs(input: VSOut) -> FSOut {
  // fragment position i normal w view-space
  let fragPos = textureSample(positionTexture, samp, input.uv).xyz;
  let normal  = normalize(textureSample(normalTexture, samp, input.uv).xyz);

  var occlusion = 0.0;
  let radius = 0.5;
  let bias   = 0.025;

  for (var i = 0u; i < 32u; i = i + 1u) {
    // pobranie próbki w lokalnym układzie normal
    let sampleVec = ssaoUni.samples[i].xyz;
    
    // konstrukcja TBN (Tangent-Bitangent-Normal) dla view-space
    var up: vec3<f32>;
    if (abs(normal.z) < 0.999) {
        up = vec3<f32>(0.0, 0.0, 1.0);
    } else {
        up = vec3<f32>(1.0, 0.0, 0.0);
    }
    let tangent   = normalize(cross(up, normal));
    let bitangent = cross(normal, tangent);
    let TBN = mat3x3<f32>(tangent, bitangent, normal);

    // próbka w view-space
    let samplePos = fragPos + TBN * sampleVec * radius;

    // rzut na ekran (NDC)
    let clipPos = ssaoUni.viewProjectionInverse * vec4<f32>(samplePos, 1.0);
    let ndc = clipPos.xyz / clipPos.w;
    let uv = ndc.xy * 0.5 + 0.5;

    // sprawdzenie głębokości
    if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
      let sampleDepth = textureSample(positionTexture, samp, uv).z;
      if (sampleDepth >= samplePos.z - bias) {
        occlusion += 1.0;
      }
    }
  }

  occlusion = 1.0 - (occlusion / f32(32));

  var out: FSOut;
  out.aoOut = vec4<f32>(occlusion, occlusion, occlusion, 1.0);
  return out;
}
