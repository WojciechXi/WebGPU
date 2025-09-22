struct VSOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
  var out: VSOut;
  let pos = array<vec2<f32>,6>(
    vec2<f32>(-1.0,-1.0), vec2<f32>(1.0,-1.0), vec2<f32>(-1.0,1.0),
    vec2<f32>(-1.0,1.0),  vec2<f32>(1.0,-1.0), vec2<f32>(1.0,1.0)
  );
  out.uv = (pos[vid] + vec2<f32>(1.0)) * 0.5;
  out.pos = vec4<f32>(pos[vid],0.0,1.0);
  return out;
}

@group(0) @binding(0) var posTex: texture_2d<f32>;
@group(0) @binding(1) var normTex: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

const kernelSize: u32 = 16u;
var<private> kernel: array<vec3<f32>,16> = array<vec3<f32>,16>(
  vec3<f32>(0.1,0.2,0.3), vec3<f32>(-0.4,0.1,0.2), vec3<f32>(0.2,-0.5,0.1),
  vec3<f32>(0.3,0.3,0.6), vec3<f32>(-0.2,-0.3,0.4), vec3<f32>(0.6,0.1,-0.2),
  vec3<f32>(-0.1,0.7,0.2), vec3<f32>(0.2,-0.2,-0.5), vec3<f32>(0.4,0.4,0.4),
  vec3<f32>(-0.5,0.3,0.1), vec3<f32>(0.3,-0.1,0.6), vec3<f32>(0.1,-0.3,-0.2),
  vec3<f32>(0.2,0.2,0.2), vec3<f32>(-0.2,0.4,-0.3), vec3<f32>(0.5,-0.2,0.1),
  vec3<f32>(0.1,0.6,-0.4)
);

@fragment fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let fragPos = textureSample(posTex,samp,in.uv).xyz;
  let normal = normalize(textureSample(normTex,samp,in.uv).xyz);

  var occlusion: f32 = 0.0;
  let radius: f32 = 0.5;
  for (var i=0u; i<kernelSize; i++) {
    let samplePos = fragPos + normal * kernel[i] * radius;
    // tu uproszczenie: w pełnym SSAO porównujesz głębokości
    if (dot(normal, samplePos-fragPos) < 0.0) {
      occlusion += 1.0;
    }
  }
  occlusion = 1.0 - (occlusion / f32(kernelSize));
  return vec4<f32>(vec3<f32>(occlusion),1.0);
}
