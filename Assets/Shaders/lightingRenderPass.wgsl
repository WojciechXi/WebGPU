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

// 3x3 PCF shadow sample
fn sampleShadow(shadowUV: vec2f, depth: f32, radius: i32) -> f32 {
    // textureDimensions returns integer vec2; rzutujemy na float
    let dims_i = textureDimensions(shadowTexture, 0);
    let dims = vec2f(f32(dims_i.x), f32(dims_i.y));
    let texelSize = vec2f(1.0, 1.0) / dims;

    var shadow: f32 = 0.0;
    var total: f32 = 0.0;

    // 3x3 PCF kernel
    for (var ox: i32 = -radius; ox <= radius; ox = ox + 1) {
        for (var oy: i32 = -radius; oy <= radius; oy = oy + 1) {
            let offset = vec2f(f32(ox), f32(oy)) * texelSize;
            // clamp UV to avoid sampling outside
            let sampleUV = clamp(shadowUV + offset, vec2f(0.0), vec2f(1.0));
            let depthSample = textureSample(shadowTexture, screenSampler, sampleUV).r;
            // simple depth compare with small bias
            if (depth - 0.001 <= depthSample) {
                shadow = shadow + 1.0;
            }
            total += 1.0;
        }
    }

    return shadow / total;
}

struct Uniforms {
    cameraMatrix : mat4x4f,
    viewMatrix : mat4x4f,
    projectionMatrix : mat4x4f,
    lightViewMatrix : mat4x4f,
    lightProjectionMatrix : mat4x4f,
    lightColor : vec4f,
    shadowColor : vec4f,
    ambientLightColor : vec4f,
};

@group(0) @binding(0) var<uniform> uni : Uniforms;
@group(0) @binding(1) var screenSampler : sampler;
@group(0) @binding(2) var worldPositionTexture : texture_2d<f32>;
@group(0) @binding(3) var worldNormalTexture : texture_2d<f32>;
@group(0) @binding(4) var colorTexture : texture_2d<f32>;
@group(0) @binding(5) var pbrTexture : texture_2d<f32>;
@group(0) @binding(6) var shadowTexture : texture_2d<f32>;

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

@fragment
fn fs(vsOut: VSOut) -> @location(0) vec4f {
    let viewMatrix = uni.viewMatrix;
    let projectionMatrix = uni.projectionMatrix;

    let lightViewMatrix = uni.lightViewMatrix;
    let lightProjectionMatrix = uni.lightProjectionMatrix;
    
    let viewNormalMatrix = getNormalMatrix(viewMatrix);
    let lightNormalMatrix = getNormalMatrix(lightViewMatrix);

    let worldPosition = textureSample(worldPositionTexture, screenSampler, vsOut.uv);
    let worldNormal = normalize(textureSample(worldNormalTexture, screenSampler, vsOut.uv).xyz);

    var viewPosition = viewMatrix * worldPosition;
    let viewNormal = normalize(viewNormalMatrix * worldNormal);
    
    // Bezpiecznie znormalizuj / podziel przez w jeśli jest to vec4 z w != 1
    var viewPos: vec3f = viewPosition.xyz;
    if (abs(viewPosition.w) > 1e-6) {
        viewPos = viewPosition.xyz / viewPosition.w;
    }

    // world position (do shadow mapping)
    let worldPos3 = worldPosition.xyz / worldPosition.w;

    // light direction: obliczamy direction w world space z macierzy widoku światła
    let lightWorldDirection = normalize((inverse4(lightViewMatrix) * vec4f(0.0, 0.0, -1.0, 0.0)).xyz);
    let lightViewDirection = normalize(viewNormalMatrix * lightWorldDirection);

    // shadow coords (zwróć uwagę na flip Y jeśli potrzeba)
    let lightClip = lightProjectionMatrix * lightViewMatrix * vec4f(worldPosition.xyz, 1.0);
    let lightNDC = lightClip.xyz / lightClip.w;
    let lightDepth = lightNDC.z; // w zależności od projektu może wymagać remap do [0,1]
    let shadowUV = lightNDC.xy * 0.5 + vec2f(0.5, 0.5);
    let shadowSampleVal = (sampleShadow(vec2f(shadowUV.x, 1.0 - shadowUV.y), lightDepth, 3) + 0.1) / 1.1;

    // --- kolory i PBR kanały (konwencja: R = roughness, G = metallic, B = ao) ---
    let color = textureSample(colorTexture, screenSampler, vsOut.uv);

    let pbr = textureSample(pbrTexture, screenSampler, vsOut.uv);
    let roughness = clamp(pbr.r, 0.01, 0.8); 
    let metallic = clamp(pbr.g, 0.0, 1.0);   
    let occlusion = clamp(pbr.b, 0.0, 1.0);
    let emission = clamp(pbr.a, 0.0, 1.0); 
    
    let emissionColor = color.rgb * emission;

    // światła / ambient
    let lightColor = uni.lightColor.rgb * uni.lightColor.a;
    let ambientColor = uni.ambientLightColor.rgb * uni.ambientLightColor.a;

    let diff = max(dot(viewNormal, -lightViewDirection), 0.0);
    let diffuse = lightColor * color.rgb * diff * shadowSampleVal;

    let cameraPosition = uni.cameraMatrix[3].xyz;
    let specularStrength = 2.0;

    let viewDirection = normalize(cameraPosition - worldPosition.xyz);
    let reflectDirection = reflect(lightWorldDirection, worldNormal);
    let spec = pow(max(dot(viewDirection, reflectDirection), 0.0), 32);

    let F0 = mix(color.rgb * lightColor, lightColor, metallic);
    let specular = F0 * spec * specularStrength * (1.0 - roughness) * shadowSampleVal; // non-metal vs metal

    let ambient = ambientColor * color.rgb * occlusion;

    return vec4f( ambient + specular + emissionColor + diffuse, 1);
}
