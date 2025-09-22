class Graphics {

    static {
        this.lightDirection = Vector3.down;
        this.lightColor = Color.white;
        this.ambientLightColor = Color.zero;
    }

    static get Width() { return this.canvas.width; }
    static get Height() { return this.canvas.height; }

    static async Init(callback) {
        const canvas = this.canvas = document.querySelector('canvas');
        const context = this.context = canvas.getContext('webgpu');
        const currentTexture = this.currentTexture = null;
        const depthTexture = this.depthTexture = null;

        this.colorAttachment = {
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
        };

        this.depthStencilAttachment = {
            depthLoadOp: 'clear',
            depthClearValue: 1.0,
            depthStoreOp: 'store',
        };

        this.renderPassDescriptor = {
            label: 'our basic canvas renderPass',
            colorAttachments: [
                this.colorAttachment,
            ],
            depthStencilAttachment: this.depthStencilAttachment,
        };

        callback();
    }

    static Update() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    static PreRender() {
        this.currentTexture = this.context.getCurrentTexture();
        if (!this.depthTexture || this.depthTexture.width !== this.currentTexture.width || this.depthTexture.height !== this.currentTexture.height) {
            if (this.depthTexture) this.depthTexture.destroy();
            this.depthTexture = GPU.CreateTexture({
                size: [this.currentTexture.width, this.currentTexture.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
        }

        this.colorAttachment.view = this.currentTexture.createView();
        this.depthStencilAttachment.view = this.depthTexture.createView();

        this.commandEncoder = GPU.CreateCommandEncoder();
        this.passEncoder = this.commandEncoder.beginRenderPass(this.renderPassDescriptor);
    }

    static Render() {

    }

    static PostRender() {
        this.passEncoder.end();
        GPU.Queue.submit([this.commandEncoder.finish()]);
    }

}