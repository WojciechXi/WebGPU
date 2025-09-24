class ForwardRenderPass extends RenderPass {

    Init(data) {
        const canvas = data.canvas;

        this.colorTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.depthTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.depthStencilTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
    }

    Render(engine, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.colorTexture.createView(), loadOp: "clear", storeOp: "store" },

                { view: this.depthTexture.createView(), clearValue: { r: 1.0, g: 0, b: 0, a: 1 }, loadOp: "clear", storeOp: "store", }
            ],
            depthStencilAttachment: {
                view: this.depthStencilTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store"
            },
        });

        engine.Render(this);

        renderPass.end();
    }

}