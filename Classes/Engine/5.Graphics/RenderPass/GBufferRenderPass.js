class GBufferRenderPass extends RenderPass {

    Init(data) {
        this.colorRenderTexture = data.colorRenderTexture;
        this.worldNormalRenderTexture = data.worldNormalRenderTexture;
        this.pbrRenderTexture = data.pbrRenderTexture;
        this.emissiveRenderTexture = data.emissiveRenderTexture;
        this.depthRenderTexture = data.depthRenderTexture;
    }

    GetTargets() {
        return [
            this.colorRenderTexture.GetTarget(),
            this.worldNormalRenderTexture.GetTarget(),
            this.pbrRenderTexture.GetTarget(),
            this.emissiveRenderTexture.GetTarget(),
        ];
    }

    Render(camera, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.colorRenderTexture.GetColorAttachment('clear', 'store', scene.ambientLight.color),
                this.worldNormalRenderTexture.GetColorAttachment(),
                this.pbrRenderTexture.GetColorAttachment(),
                this.emissiveRenderTexture.GetColorAttachment(),
            ],
            depthStencilAttachment: this.depthRenderTexture.GetDepthStencilAttachment('load', 'discard'),
        });

        renderPass.setViewport(this.colorRenderTexture.width * camera.rect.x, this.colorRenderTexture.height * camera.rect.y, this.colorRenderTexture.width * camera.rect.width, this.colorRenderTexture.height * camera.rect.height, 0, 1);
        renderPass.setScissorRect(this.colorRenderTexture.width * camera.rect.x, this.colorRenderTexture.height * camera.rect.y, this.colorRenderTexture.width * camera.rect.width, this.colorRenderTexture.height * camera.rect.height);

        renderPass.setBindGroup(0, camera.cameraBindGroup);
        RenderQueue.Flush(this, camera);

        renderPass.end();
    }

}