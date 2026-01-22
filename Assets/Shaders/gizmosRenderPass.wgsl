struct View {
    matrix : mat4x4f,
    projection : mat4x4f,
    viewProjection : mat4x4f,
    inverseView : mat4x4f,
    inverseViewProjection : mat4x4f,
};

struct Transform {
    matrix : mat4x4f,
};

struct Vertex {
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) tangent: vec4f,
    @location(3) color: vec4f,
    @location(4) uv: vec2f,
};

struct VSOut {
    @builtin(position) clipPosition: vec4f,
    @location(0) color: vec4f,
};

@group(0) @binding(0) var<uniform> view: View;
@group(1) @binding(0) var<uniform> transform: Transform;

@vertex
fn vs(vert: Vertex) -> VSOut {
    var vsOut: VSOut;

    vsOut.clipPosition = view.viewProjection * transform.matrix * vec4f(vert.position, 1.0);
    vsOut.color = vec4f(0, 0, 0, 1);

    return vsOut;
}

@fragment
fn fs(vsOut: VSOut) -> @location(0) vec4f {
    return vsOut.color; 
}
