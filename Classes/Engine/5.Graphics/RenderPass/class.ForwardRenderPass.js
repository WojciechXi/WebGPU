class ForwardRenderPass extends RenderPass {

    Init(data) {
        const canvas = data.canvas;

        this.sceneRenderTexture = new RenderTexture(canvas.width, canvas.height, { format: 'rgba16float', });
        this.depthRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'depth24plus', });
    }

    Render(cameras, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.sceneRenderTexture.GetColorAttachment(),
            ],
            depthStencilAttachment: this.depthRenderTexture.GetDepthStencilAttachment(),
        });
        renderPass.setViewport(this.canvas.width * camera.rect.x, this.canvas.height * camera.rect.y, this.canvas.width * camera.rect.width, this.canvas.height * camera.rect.height, 0, 1);

        for (let component of camera.renderables) component.OnDraw(this, camera);

        renderPass.end();
    }

}