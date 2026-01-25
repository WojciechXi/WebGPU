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

        for (let component of camera.renderables) component.OnDraw(this, camera);

        renderPass.end();
    }

}