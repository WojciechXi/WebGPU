class Graphics {

    static async Init(callback) {
        let adapter = this.adapter = await navigator.gpu?.requestAdapter();
        let device = this.device = await adapter?.requestDevice();

        if (!device) {
            fail('need a browser that supports WebGPU');
            return;
        }

        let canvas = this.canvas = document.querySelector('canvas');
        let context = this.context = canvas.getContext('webgpu');
        let depthTexture = this.depthTexture = null;

        let renderPassDescriptor = this.renderPassDescriptor = {
            label: 'our basic canvas renderPass',
            colorAttachments: [
                {
                    // view: <- to be filled out when we render
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                // view: <- to be filled out when we render
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        };

        callback();
    }

    static Update() {

    }

    static PreRender() {
        if (!Camera.main) return;
        let object = this;

        object.canvas.width = object.canvas.clientWidth;
        object.canvas.height = object.canvas.clientHeight;

        Camera.main.aspect = object.canvas.width / object.canvas.height;

        Camera.main.Update();
        Camera.main.transform.Update();

        const canvasTexture = object.context.getCurrentTexture();
        object.renderPassDescriptor.colorAttachments[0].view = canvasTexture.createView();

        if (!object.depthTexture || object.depthTexture.width !== canvasTexture.width || object.depthTexture.height !== canvasTexture.height) {
            if (object.depthTexture) object.depthTexture.destroy();
            object.depthTexture = object.device.createTexture({
                size: [canvasTexture.width, canvasTexture.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
        }
        object.renderPassDescriptor.depthStencilAttachment.view = object.depthTexture.createView();

        let encoder = object.encoder = object.device.createCommandEncoder();
        let pass = object.pass = encoder.beginRenderPass(object.renderPassDescriptor);
    }

    static Render() {
        let object = this;
        let pass = object.pass;
    }

    static PostRender() {
        let object = this;
        let pass = object.pass;
        let encoder = object.encoder;

        pass.end();

        const commandBuffer = encoder.finish();
        object.device.queue.submit([commandBuffer]);
    }

}