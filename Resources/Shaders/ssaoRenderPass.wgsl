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

fn inverse4(m : mat4x4f) -> mat4x4f {
    let a00 = m[0][0]; let a01 = m[0][1]; let a02 = m[0][2]; let a03 = m[0][3];
    let a10 = m[1][0]; let a11 = m[1][1]; let a12 = m[1][2]; let a13 = m[1][3];
    let a20 = m[2][0]; let a21 = m[2][1]; let a22 = m[2][2]; let a23 = m[2][3];
    let a30 = m[3][0]; let a31 = m[3][1]; let a32 = m[3][2]; let a33 = m[3][3];

    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;

    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    let invDet = 1.0 / det;

    // each vec4(...) / det to produce columns (column-major)
    return mat4x4f(
        vec4f( a11 * b11 - a12 * b10 + a13 * b09,  a02 * b10 - a01 * b11 - a03 * b09,  a31 * b05 - a32 * b04 + a33 * b03,  a22 * b04 - a21 * b05 - a23 * b03) * invDet,
        vec4f( a12 * b08 - a10 * b11 - a13 * b07,  a00 * b11 - a02 * b08 + a03 * b07,  a32 * b02 - a30 * b05 - a33 * b01,  a20 * b05 - a22 * b02 + a23 * b01) * invDet,
        vec4f( a10 * b10 - a11 * b08 + a13 * b06,  a01 * b08 - a00 * b10 - a03 * b06,  a30 * b04 - a31 * b02 + a33 * b00,  a21 * b02 - a20 * b04 - a23 * b00) * invDet,
        vec4f( a11 * b07 - a10 * b09 - a12 * b06,  a00 * b09 - a01 * b07 + a02 * b06,  a31 * b01 - a30 * b03 - a32 * b00,  a20 * b03 - a21 * b01 + a22 * b00) * invDet
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

struct Uniforms {
  samples : array<vec4f, 64>,
  viewMatrix : mat4x4f,
  projectionMatrix : mat4x4f,
  screenSize : vec2f,
  radius : f32,
  bias : f32,
  blurRadius : f32,
  sigmaDepth : f32,
  strength : f32,
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
@group(0) @binding(0) var<uniform> uniforms : Uniforms;
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

  let viewMatrix = uniforms.viewMatrix;
  let normalMatrix = getNormalMatrix(viewMatrix);

  let worldPoition = textureSample(worldPositionTexture, screenSampler, uv);
  let viewPosition4 = viewMatrix * vec4f(worldPoition.xyz, 1.0);
  let viewPosition = viewPosition4.xyz;

  let clipPosition = uniforms.projectionMatrix * viewMatrix * worldPoition;

  let noiseScale = screenSize / 4;
  let noiseUV = fract(uv * noiseScale);

  let worldNormal = normalize(textureSample(worldNormalTexture, screenSampler, vsOut.uv).xyz * 2.0 - 1.0);
  let viewNormal = normalMatrix * worldNormal;

  let random = (textureSample(noiseTexture, noiseSampler, noiseUV).xyz * 2.0 - 1.0);
  let noise = normalize(random);

  let tangent = normalize(noise - viewNormal * dot(noise, viewNormal));
  let bitangent = cross(viewNormal, tangent);
  let TBN = mat3x3f(tangent, bitangent, viewNormal);

  if(clipPosition.z > 0) {
    var occlusion : f32 = 0.0;
    for (var i = 0u; i < 64u; i++) {
      // Kernel sample w view space
      var sample = TBN * uniforms.samples[i].xyz;
      sample = viewPosition + sample * uniforms.radius;

      // Przekształcenie do UV (proj. matrix)
      let offset = uniforms.projectionMatrix * vec4f(sample, 1.0);
      let offsetNDC = offset.xyz / offset.w;
      let offsetUV = offsetNDC.xy * 0.5 + 0.5;

      // Pobieramy depth w view space (G-buffer musi mieć view-space Z)
      let sampleWorldPosition = textureSample(worldPositionTexture, screenSampler, vec2f(offsetUV.x, 1.0 - offsetUV.y)).xyz;
      let sampleViewPosition = viewMatrix * vec4f(sampleWorldPosition, 1.0);
      let sampleDepth = sampleViewPosition.z;

      let rangeCheck = smoothstep(1.0, 0.0, uniforms.radius / abs(viewPosition.z - sampleDepth));
      occlusion += select(0.0, 1.0, sampleDepth < sample.z - uniforms.bias) * rangeCheck;
    }

    occlusion = 1.0 - (occlusion / 64.0);
    fsOut.colorOut = vec4f(pow(occlusion, uniforms.strength));
  } else {
    fsOut.colorOut = vec4f(1);
  }

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
