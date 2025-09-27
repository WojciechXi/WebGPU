class ShadowRenderPass extends RenderPass {

    Init(data) {
        const canvas = data.canvas;

        this.depthTexture = GPU.CreateTexture({
            size: [512, 512],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.depthTextureView = this.depthTexture.createView();
    }

    Render(engine, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.depthTextureView, clearValue: { r: 1.0, g: 0, b: 0, a: 1 }, loadOp: "clear", storeOp: "store", }
            ],
        });

        engine.Render(this);

        renderPass.end();
    }

}