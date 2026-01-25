class GBufferRenderPass extends RenderPass {

    Init(data) {
        this.canvas = data.canvas;

        this.positionRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'rgba16float', });
        this.normalRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'rgba8unorm', });
        this.colorRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'rgba16float', });
        this.pbrRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'rgba8unorm', });

        this.depthRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'depth24plus', depth: true, });
    }

    Render(cameras, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.positionRenderTexture.GetColorAttachment(),
                this.normalRenderTexture.GetColorAttachment(),
                this.colorRenderTexture.GetColorAttachment(),
                this.pbrRenderTexture.GetColorAttachment(),
            ],
            depthStencilAttachment: this.depthRenderTexture.GetDepthStencilAttachment(),
        });

        for (let camera of cameras) {
            renderPass.setBindGroup(0, camera.cameraBindGroup);
            renderPass.setViewport(this.positionRenderTexture.width * camera.rect.x, this.positionRenderTexture.height * camera.rect.y, this.positionRenderTexture.width * camera.rect.width, this.positionRenderTexture.height * camera.rect.height, 0, 1);
            renderPass.setScissorRect(this.positionRenderTexture.width * camera.rect.x, this.positionRenderTexture.height * camera.rect.y, this.positionRenderTexture.width * camera.rect.width, this.positionRenderTexture.height * camera.rect.height);
            for (let component of camera.renderables) component.OnDraw(this, camera);
        }

        renderPass.end();
    }

}