class Material {

    constructor(shader) {
        this.shader = shader;
        this.uniformBuffer = null;
        this.bindGroup = null;
    }

    Init() {
        let uniformBufferSize = (16 + 4) * 4;

        let uniformBuffer = this.uniformBuffer = Graphics.device.createBuffer({
            label: 'uniforms',
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        let bindGroup = this.bindGroup = Graphics.device.createBindGroup({
            label: 'bind group for object',
            layout: this.shader.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: uniformBuffer } },
            ],
        });
    }

    Use(pass) {
        this.shader.Use(pass);
    }

}