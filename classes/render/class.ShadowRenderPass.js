class ShadowRenderPass extends RenderPass {

    Init(data) {
        this.resolution = data.resolution ?? 1024;
        this.canvas = data.canvas;

        this.depthTexture = GPU.CreateTexture({
            size: [this.resolution, this.resolution],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.depthTextureView = this.depthTexture.createView();

        this.depthStencilTexture = GPU.CreateTexture({
            size: [this.resolution, this.resolution],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.depthStencilTextureView = this.depthStencilTexture.createView();
    }

    Render(engine, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.depthTextureView, clearValue: { r: 1.0, g: 0, b: 0, a: 1 }, loadOp: "clear", storeOp: "store", }
            ],
            depthStencilAttachment: {
                view: this.depthStencilTextureView,
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store"
            },
        });

        engine.Render(this);

        renderPass.end();
    }

}