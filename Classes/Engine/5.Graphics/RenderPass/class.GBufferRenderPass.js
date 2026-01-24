class GBufferRenderPass extends RenderPass {

    Init(data) {
        this.canvas = data.canvas;

        this.positionRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'rgba16float', });
        this.normalRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'rgba8unorm', });
        this.colorRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'rgba16float', });
        this.pbrRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'rgba8unorm', });

        this.depthRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'depth24plus', depth: true, });
    }

    Render(camera, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.positionRenderTexture.GetColorAttachment(),
                this.normalRenderTexture.GetColorAttachment(),
                this.colorRenderTexture.GetColorAttachment(),
                this.pbrRenderTexture.GetColorAttachment(),
            ],
            depthStencilAttachment: this.depthRenderTexture.GetDepthStencilAttachment(),
        });

        for (let component of camera.renderables) component.OnDraw(this, camera);

        renderPass.end();
    }

}