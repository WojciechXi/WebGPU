struct Uniforms {
    viewProjection : mat4x4f,
};

struct Vertex {
    @location(0) position: vec3f,
};

@group(0) @binding(0) var<uniform> light : Uniforms;

struct VSOut {
    @builtin(position) position : vec4f,
};

@vertex
fn vs(vert: Vertex) -> VSOut {
    var vsOut: VSOut;
    vsOut.position = light.viewProjection * vec4f(vert.position, 1.0);
    return vsOut;
}

@fragment
fn fs() {
    // Pusty fragment shader – zapisuje tylko depth
}
