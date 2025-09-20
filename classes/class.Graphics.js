class Graphics {

    static get Width() { return this.canvas.width; }
    static get Height() { return this.canvas.height; }

    static async Init(callback) {
        let adapter = this.adapter = await navigator.gpu?.requestAdapter();
        let device = this.device = await adapter?.requestDevice();

        if (!device) return alert('need a browser that supports WebGPU');

        let canvas = this.canvas = document.querySelector('canvas');
        let context = this.context = canvas.getContext('webgpu');
        let depthTexture = this.depthTexture = null;

        let renderPassDescriptor = this.renderPassDescriptor = {
            label: 'our basic canvas renderPass',
            colorAttachments: [
                {
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        };

        callback();
    }

    static Update() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    static PreRender() {
        let renderPassDescriptor = this.renderPassDescriptor;

        let currentTexture = this.currentTexture = this.context.getCurrentTexture();
        renderPassDescriptor.colorAttachments[0].view = currentTexture.createView();

        if (!this.depthTexture || this.depthTexture.width !== currentTexture.width || this.depthTexture.height !== currentTexture.height) {
            if (this.depthTexture) this.depthTexture.destroy();
            this.depthTexture = this.device.createTexture({
                size: [currentTexture.width, currentTexture.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
        }

        renderPassDescriptor.depthStencilAttachment.view = this.depthTexture.createView();

        this.encoder = this.device.createCommandEncoder();
        this.pass = this.encoder.beginRenderPass(this.renderPassDescriptor);
    }

    static Render() {

    }

    static PostRender() {
        this.pass.end();

        const commandBuffer = this.encoder.finish();
        this.device.queue.submit([commandBuffer]);
    }

}