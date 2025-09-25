fn encodeVector(n: vec3f) -> vec3f {
  return n * 0.5 + vec3f(0.5);
}

fn mat3_from_mat4(m: mat4x4f) -> mat3x3f {
    return mat3x3f(
        m[0].xyz,
        m[1].xyz,
        m[2].xyz
    );
}

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

struct Uniforms {
    modelMatrix : mat4x4f,
    viewMatrix : mat4x4f,
    projectionMatrix : mat4x4f,
    color : vec4f,
    pbr : vec4f,
};

struct Vertex {
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) color: vec3f,
    @location(3) uv: vec2f,
};

@group(0) @binding(0) var<uniform> uni : Uniforms;
@group(0) @binding(1) var textureSampler : sampler;
@group(0) @binding(2) var albedo : texture_2d<f32>;

struct VSOut {
  @builtin(position) clipPosition : vec4f,
  @location(0) worldPosition : vec3f,
  @location(2) viewPosition : vec3f,
  @location(3) normal  : vec3f,
  @location(4) uv : vec2f,
};

@vertex
fn vs(vert: Vertex) -> VSOut {
  var vsOut: VSOut;

  let modelMatrix = uni.modelMatrix;
  let viewMatrix = uni.viewMatrix;
  let projectionMatrix = uni.projectionMatrix;

  let worldPosition = (modelMatrix * vec4f(vert.position, 1.0)).xyz;
  let viewPosition = (viewMatrix * vec4f(worldPosition, 1.0)).xyz;
  let clipPosition = projectionMatrix * viewMatrix * vec4f(worldPosition, 1.0);

  vsOut.clipPosition = clipPosition;
  vsOut.worldPosition = worldPosition;
  vsOut.viewPosition = viewPosition;

  let normalMatrix = transpose3(inverse3(mat3_from_mat4(modelMatrix)));
  vsOut.normal = normalize(normalMatrix * vert.normal) * 0.5 + vec3f(0.5);
  vsOut.uv = vert.uv;

  return vsOut;
}

//gBufferRenderPass

struct GBufferRenderPass {
  @location(0) screenPositionOut : vec4f,
  @location(1) screenNormalOut : vec4f,
  @location(2) screenTangentOut : vec4f,
  
  @location(3) colorOut : vec4f,
  @location(4) normalOut : vec4f,
  @location(5) emissionOut : vec4f,
  @location(6) pbrOut : vec4f, // Metallic/ Roughness / Smoothness / Occlusion
  
  @location(7) depthOut : vec4f,
}

@fragment
fn gBufferRenderPass(vsOut: VSOut) -> GBufferRenderPass {
  var gBufferRenderPass: GBufferRenderPass;

  let color = uni.color;
  let albedo = textureSample(albedo, textureSampler, vsOut.uv);

  gBufferRenderPass.screenPositionOut = vec4f(vsOut.clipPosition.xyz / vsOut.clipPosition.w, 1.0);
  gBufferRenderPass.screenNormalOut = vec4f(vsOut.normal, 0.0);
  gBufferRenderPass.screenTangentOut = vec4f(1.0, 0.5, 0.0, 1.0);

  gBufferRenderPass.colorOut = vec4f(albedo.rgb * color.rgb, 1.0);
  gBufferRenderPass.normalOut = vec4f(0.0, 1.0, 0.0, 1.0);
  gBufferRenderPass.emissionOut = vec4f(0.0, 0.0, 0.0, 1.0);
  gBufferRenderPass.pbrOut = vec4f(0.0, 0.0, 0.0, 1.0);

  gBufferRenderPass.depthOut = vec4f(vsOut.viewPosition.z, 0.0, 0.0, 1.0);

  return gBufferRenderPass;
}