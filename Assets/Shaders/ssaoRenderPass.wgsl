fn transpose3(m: mat3x3f) -> mat3x3f {
    return mat3x3f(
        vec3f(m[0][0], m[1][0], m[2][0]),
        vec3f(m[0][1], m[1][1], m[2][1]),
        vec3f(m[0][2], m[1][2], m[2][2])
    );
}

fn inverse3(m: mat3x3f) -> mat3x3f {
    let a = m[0][0]; let b = m[0][1]; let c = m[0][2];
    let d = m[1][0]; let e = m[1][1]; let f = m[1][2];
    let g = m[2][0]; let h = m[2][1]; let i = m[2][2];

    let A =  (e*i - f*h);
    let B = -(d*i - f*g);
    let C =  (d*h - e*g);
    let D = -(b*i - c*h);
    let E =  (a*i - c*g);
    let F = -(a*h - b*g);
    let G =  (b*f - c*e);
    let H = -(a*f - c*d);
    let I =  (a*e - b*d);

    let det = a*A + b*B + c*C;
    let invDet = 1.0 / det;

    return mat3x3f(
        vec3f(A, D, G) * invDet,
        vec3f(B, E, H) * invDet,
        vec3f(C, F, I) * invDet
    );
}

fn getNormalMatrix(modelMatrix: mat4x4f) -> mat3x3f {
    let m3 = mat3x3f(
        modelMatrix[0].xyz,
        modelMatrix[1].xyz,
        modelMatrix[2].xyz
    );
    return transpose3(inverse3(m3));
}

struct SSAOUniforms {
  samples : array<vec4f, 32>,
  viewMatrix : mat4x4f,
  projectionMatrix : mat4x4f,
  screenSize : vec2f,
  radius : f32,
  bias : f32,
  blurRadius : f32,
  sigmaDepth : f32,
};

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
@group(0) @binding(0) var<uniform> uniforms : SSAOUniforms;
@group(0) @binding(1) var screenSampler : sampler;
@group(0) @binding(2) var noiseSampler : sampler;
@group(0) @binding(3) var worldPositionTexture : texture_2d<f32>;  // world-space depth / z
@group(0) @binding(4) var worldNormalTexture : texture_2d<f32>; // world-space normal
@group(0) @binding(5) var noiseTexture : texture_2d<f32>;
@group(0) @binding(6) var ssaoTexture : texture_2d<f32>;
@group(0) @binding(7) var sceneTexture : texture_2d<f32>;

struct FSOut {
  @location(0) colorOut : vec4f,
};

@fragment
fn ssaoRenderPass(vsOut: VSOut) -> FSOut {
  var fsOut: FSOut;
  let uv = vsOut.uv;

  let screenSize = vec2f(textureDimensions(worldPositionTexture));

  let normalMatrix = getNormalMatrix(uniforms.viewMatrix);

  let worldPoition = textureSample(worldPositionTexture, screenSampler, uv);
  let viewPosition4 = uniforms.viewMatrix * vec4f(worldPoition.xyz, 1.0);
  let viewPosition = viewPosition4.xyz;

  let noiseScale = screenSize / 4;
  let noiseUV = fract(uv * noiseScale);

  let worldNormal = normalize(textureSample(worldNormalTexture, screenSampler, uv).rgb);
  let viewNormal = normalMatrix * worldNormal;

  let random = textureSample(noiseTexture, noiseSampler, noiseUV).xyz;
  let noise = normalize(random);

  let tangent = normalize(noise - viewNormal * dot(noise, viewNormal));
  let bitangent = cross(viewNormal, tangent);
  let TBN = mat3x3f(tangent, bitangent, viewNormal);

  var occlusion : f32 = 0.0;
  for (var i = 0u; i < 32u; i++) {
    // Kernel sample w view space
    var sample = TBN * uniforms.samples[i].xyz;
    sample = viewPosition + sample * uniforms.radius;

    // Przekształcenie do UV (proj. matrix)
    var offset = uniforms.projectionMatrix * vec4f(sample, 1.0);
    var offsetNDC = offset.xyz / offset.w;
    var offsetUV = offsetNDC.xy * 0.5 + 0.5;
    offsetUV.y = -offsetUV.y;

    // Pobieramy depth w view space (G-buffer musi mieć view-space Z)
    let sampleViewPos = textureSample(worldPositionTexture, screenSampler, offsetUV).xyz;
    let sampleDepth = (uniforms.viewMatrix * vec4f(sampleViewPos, 1.0)).z;

    let rangeCheck = smoothstep(0.0, 1.0, uniforms.radius / abs(viewPosition.z - sampleDepth));
    occlusion += select(0.0, 1.0, sampleDepth >= sample.z + uniforms.bias) * rangeCheck;
  }

  occlusion = 1.0 - (occlusion / 32.0);
  fsOut.colorOut = vec4f(occlusion);

  return fsOut;
}

@fragment
fn blurHorizontalRenderPass(vsOut: VSOut) -> FSOut {
    var fsOut: FSOut;

    let screenSize = vec2f(textureDimensions(ssaoTexture));

    let radius = uniforms.blurRadius;
    let sigmaDepth = uniforms.sigmaDepth;

    let uvOffset = vec2f(1.0 / screenSize.x, 1.0 / screenSize.y);
    let centerDepth = textureSample(ssaoTexture, screenSampler, vsOut.uv).r;

    var weight: f32 = 0.0;
    var weightSum: f32 = 0.0;
    for (var i = -radius; i <= radius; i += 1) {
        let offset = vec2f(f32(i), 0.0);
        
        let sampleUV = vsOut.uv + offset * uvOffset;
        let sample = textureSample(ssaoTexture, screenSampler, sampleUV).r;
        
        // waga bilateralna
        let w = exp(-pow(sample - centerDepth, 2.0) / (2.0 * sigmaDepth * sigmaDepth));
        
        weight += sample * w;
        weightSum += w;
    }
    let blur = weight / weightSum;
    fsOut.colorOut = vec4f(blur);

    return fsOut;
}


@fragment
fn blurVerticalRenderPass(vsOut: VSOut) -> FSOut {
    var fsOut: FSOut;

    let screenSize = vec2f(textureDimensions(ssaoTexture));

    let radius = uniforms.blurRadius;
    let sigmaDepth = uniforms.sigmaDepth;

    let uvOffset = vec2f(1.0 / screenSize.x, 1.0 / screenSize.y);
    let centerDepth = textureSample(ssaoTexture, screenSampler, vsOut.uv).r;

    var weight: f32 = 0.0;
    var weightSum: f32 = 0.0;
    for (var i = -radius; i <= radius; i += 1) {
        let offset = vec2f(0.0, f32(i));
        
        let sampleUV = vsOut.uv + offset * uvOffset;
        let sample = textureSample(ssaoTexture, screenSampler, sampleUV).r;
        
        // waga bilateralna
        let w = exp(-pow(sample - centerDepth, 2.0) / (2.0 * sigmaDepth * sigmaDepth));
        
        weight += sample * w;
        weightSum += w;
    }
    let blur = weight / weightSum;
    fsOut.colorOut = vec4f(blur);

    return fsOut;
}

@fragment
fn sceneRenderPass(vsOut: VSOut) -> FSOut {
    var fsOut: FSOut;
    
    let ssao = textureSample(ssaoTexture, screenSampler, vsOut.uv);
    let scene = textureSample(sceneTexture, screenSampler, vsOut.uv);

    fsOut.colorOut = vec4f(scene.rgb * ssao.r, 1);

    return fsOut;
}
