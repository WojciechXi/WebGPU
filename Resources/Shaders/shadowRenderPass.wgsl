// ----------------------
// Matrix utilities
// ----------------------
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

// ----------------------
// Uniforms
// ----------------------

struct View {
    matrix : mat4x4f,
    projection : mat4x4f,
    viewProjection : mat4x4f,
    inverseView : mat4x4f,
    inverseViewProjection : mat4x4f,
};

struct Vertex {
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) tangent: vec4f,
    @location(3) color: vec4f,
    @location(4) uv: vec2f,
    @location(5) joints: vec4f,
    @location(6) weights: vec4f,

    @location(7) m0 : vec4<f32>,
    @location(8) m1 : vec4<f32>,
    @location(9) m2 : vec4<f32>,
    @location(10) m3 : vec4<f32>,
};

@group(0) @binding(0) var<uniform> view : View;

@group(1) @binding(0) var<uniform> jointMatrices : array<mat4x4f, 64>;

// ----------------------
// Vertex Shader
// ----------------------
struct VSOut {
  @builtin(position) clipPosition : vec4f,
};

@vertex
fn vs(vert: Vertex) -> VSOut {
  var vsOut: VSOut;
  let matrix = mat4x4<f32>(vert.m0, vert.m1, vert.m2, vert.m3);
  
  var objectPosition = vert.position;
  var worldPosition : vec3f;

  if(vert.weights.x > 0.001) {
    let skinMatrix = jointMatrices[u32(vert.joints.x)];
    worldPosition = (skinMatrix * vec4f(objectPosition, 1.0)).xyz;
  } else {
    worldPosition = (matrix * vec4f(objectPosition, 1.0)).xyz;
  }

  vsOut.clipPosition = view.viewProjection * vec4f(worldPosition, 1.0);
  return vsOut;
}

@fragment
fn fs() {}