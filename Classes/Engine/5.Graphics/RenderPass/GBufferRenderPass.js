class GBufferRenderPass extends RenderPass {

    Init(data) {
        this.canvas = data.canvas;

        this.positionRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'rgba16float',
        });

        this.normalRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'rgba8unorm',
        });

        this.colorRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'rgba8unorm',
        });

        this.pbrRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'rgba8unorm',
        });

        this.depthRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'depth24plus',
            depth: true,
        });
    }

    GetTargets() {
        return [
            this.positionRenderTexture.GetTarget(),
            this.normalRenderTexture.GetTarget(),
            this.colorRenderTexture.GetTarget(),
            this.pbrRenderTexture.GetTarget(),
        ];
    }

    Render(camera, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.positionRenderTexture.GetColorAttachment(),
                this.normalRenderTexture.GetColorAttachment(),
                this.colorRenderTexture.GetColorAttachment('clear', 'store', scene.ambientLight.color),
                this.pbrRenderTexture.GetColorAttachment(),
            ],
            depthStencilAttachment: this.depthRenderTexture.GetDepthStencilAttachment(),
        });

        // renderPass.setViewport(this.positionRenderTexture.width * camera.rect.x, this.positionRenderTexture.height * camera.rect.y, this.positionRenderTexture.width * camera.rect.width, this.positionRenderTexture.height * camera.rect.height, 0, 1);
        // renderPass.setScissorRect(this.positionRenderTexture.width * camera.rect.x, this.positionRenderTexture.height * camera.rect.y, this.positionRenderTexture.width * camera.rect.width, this.positionRenderTexture.height * camera.rect.height);

        renderPass.setBindGroup(0, camera.cameraBindGroup);
        for (let component of camera.renderables) component.OnDraw(this, camera);

        renderPass.end();
    }

}