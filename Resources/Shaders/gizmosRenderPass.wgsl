struct View {
    matrix : mat4x4f,
    projection : mat4x4f,
    viewProjection : mat4x4f,
    inverseView : mat4x4f,
    inverseViewProjection : mat4x4f,
};

struct Vertex {
    @location(0) position: vec3f,

    @location(5) m0 : vec4<f32>,
    @location(6) m1 : vec4<f32>,
    @location(7) m2 : vec4<f32>,
    @location(8) m3 : vec4<f32>,
};

struct VSOut {
    @builtin(position) clipPosition: vec4f,
    @location(0) color: vec4f,
};

@group(0) @binding(0) var<uniform> view: View;

@vertex
fn vs(vert: Vertex) -> VSOut {
    var vsOut: VSOut;
    let matrix = mat4x4<f32>(vert.m0, vert.m1, vert.m2, vert.m3);

    vsOut.clipPosition = view.viewProjection * matrix * vec4f(vert.position, 1.0);
    vsOut.color = vec4f(0, 0.5, 0, 1);

    return vsOut;
}

@fragment
fn fs(vsOut: VSOut) -> @location(0) vec4f {
    return vsOut.color; 
}
