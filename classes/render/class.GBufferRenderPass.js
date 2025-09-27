class GBufferRenderPass extends RenderPass {

    Init(data) {
        this.canvas = data.canvas;

        this.viewPositionTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.viewPositionTextureView = this.viewPositionTexture.createView();

        this.viewNormalTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.viewNormalTextureView = this.viewNormalTexture.createView();

        this.colorTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.colorTextureView = this.colorTexture.createView();

        this.emissionTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.emissionTextureView = this.emissionTexture.createView();

        this.pbrTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.pbrTextureView = this.pbrTexture.createView();

        this.depthTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.depthTextureView = this.depthTexture.createView();

        this.depthStencilTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.depthStencilTextureView = this.depthStencilTexture.createView();
    }

    Render(engine, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.viewPositionTextureView, loadOp: "clear", storeOp: "store" },
                { view: this.viewNormalTextureView, loadOp: "clear", storeOp: "store" },

                { view: this.colorTextureView, loadOp: "clear", storeOp: "store" },
                { view: this.pbrTextureView, loadOp: "clear", storeOp: "store" },

                { view: this.depthTextureView, loadOp: "clear", storeOp: "store", }
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