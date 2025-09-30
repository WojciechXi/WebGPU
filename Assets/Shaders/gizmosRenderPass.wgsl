struct Uniforms {
    modelMatrix : mat4x4f,
    viewMatrix : mat4x4f,
    projectionMatrix : mat4x4f,
    color : vec4f,
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

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@vertex
fn vs(vert: Vertex) -> VSOut {
    var vsOut: VSOut;

    vsOut.clipPosition = uniforms.projectionMatrix * uniforms.viewMatrix * uniforms.modelMatrix * vec4f(vert.position, 1.0);
    vsOut.color = uniforms.color;

    return vsOut;
}

@fragment
fn fs(vsOut: VSOut) -> @location(0) vec4f {
    return vsOut.color; 
}
