class DebugDepthRenderPass extends RenderPass {

    Init(data) {
        const canvas = data.canvas;

        this.renderPipeline = GPU.CreateRenderPipeline({
            layout: "auto",
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs",
                buffers: []
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "fs",
                targets: [
                    { format: "bgra8unorm" },
                ],
            },
            primitive: { topology: "triangle-list" },
        });

        this._texture = null;

        this.depthSampler = GPU.CreateSampler({
            compare: 'less',
            minFilter: 'linear',
            magFilter: 'linear',
        });

        this.bindGroup = null;
    }

    get texture() {
        return this._texture;
    }

    set texture(value) {
        this._texture = value;

        this.bindGroup = this._texture ? GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this._texture.createView() },
                { binding: 1, resource: this.depthSampler },
            ],
        }) : null;
    }

    Render(engine, commandEncoder) {
        if (!this.bindGroup) return;

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: Graphics.context.getCurrentTexture().createView(), // wyświetlamy na ekranie
                    loadOp: "clear",
                    storeOp: "store"
                }
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);
        renderPass.draw(6);
        renderPass.end();
    }

}