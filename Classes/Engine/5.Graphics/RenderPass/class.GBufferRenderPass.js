class GBufferRenderPass extends RenderPass {

    Init(data) {
        this.canvas = data.canvas;

        this.positionRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, {
            format: 'rgba16float',
        });

        this.normalRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, {
            format: 'rgba8unorm',
        });

        this.colorRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, {
            format: 'rgba16float',
        });

        this.emissionRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, {
            format: 'rgba16float',
        });

        this.pbrRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, {
            format: 'rgba8unorm',
        });

        this.depthTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "r32float",
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

    Render(camera, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.positionRenderTexture.GetColorAttachment(),
                this.normalRenderTexture.GetColorAttachment(),
                this.colorRenderTexture.GetColorAttachment(),
                this.pbrRenderTexture.GetColorAttachment(),

                { view: this.depthTextureView, loadOp: "clear", storeOp: "store", }
            ],
            depthStencilAttachment: {
                view: this.depthStencilTextureView,
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store"
            },
        });

        for (let component of camera.renderables) component.Draw(this, camera);

        renderPass.end();
    }

}