class ForwardRenderPass extends RenderPass {

    Init(data) {
        this.sceneRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, { format: 'rgba16float', });
        this.depthRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, { format: 'depth24plus', });
    }

    Render(camera, scene, commandEncoder) {
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