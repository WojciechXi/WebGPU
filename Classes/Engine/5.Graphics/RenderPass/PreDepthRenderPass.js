class PreDepthRenderPass extends RenderPass {

    Init(data) {
        this.depthRenderTexture = data.depthRenderTexture;
    }

    Render(camera, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [],
            depthStencilAttachment: this.depthRenderTexture.GetDepthStencilAttachment('clear', 'store'),
        });

        renderPass.setViewport(this.depthRenderTexture.width * camera.rect.x, this.depthRenderTexture.height * camera.rect.y, this.depthRenderTexture.width * camera.rect.width, this.depthRenderTexture.height * camera.rect.height, 0, 1);
        renderPass.setScissorRect(this.depthRenderTexture.width * camera.rect.x, this.depthRenderTexture.height * camera.rect.y, this.depthRenderTexture.width * camera.rect.width, this.depthRenderTexture.height * camera.rect.height);

        renderPass.setBindGroup(0, camera.cameraBindGroup);
        RenderQueue.Flush(this, camera);

        renderPass.end();
    }

}