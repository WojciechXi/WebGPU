class DebugRenderPass extends RenderPass {

    Init(data) {
        this._textureView = null;

        const canvas = data.canvas;

        const format = navigator.gpu.getPreferredCanvasFormat();

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
                    { format: format },
                ],
            },
            primitive: { topology: "triangle-list" },
        });

        this.sampler = GPU.CreateSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        this.bindGroup = null;
    }

    get textureView() {
        return this._textureView;
    }

    set textureView(textureView) {
        this._textureView = textureView;

        this.bindGroup = this._textureView ? GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this._textureView },
                { binding: 1, resource: this.sampler },
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