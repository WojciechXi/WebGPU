class Graphics {

    static {
        this.lightDirection = Vector3.down;
        this.lightColor = Color.white;
        this.ambientLightColor = Color.zero;
    }

    static get Width() { return this.canvas.width; }
    static get Height() { return this.canvas.height; }

    static async Init(assets, callback) {
        const device = GPU.device;
        const canvas = this.canvas = document.querySelector('canvas');
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        const context = this.context = canvas.getContext('webgpu');

        const format = navigator.gpu.getPreferredCanvasFormat();
        context.configure({ device, format });

        const gBufferRenderPass = this.gBufferRenderPass = new GBufferRenderPass({
            code: assets.shaders['renderPassGBuffer.wgsl'],
            canvas: canvas,
        });

        const ssaoRenderPass = this.ssaoRenderPass = new SSAORenderPass({
            code: assets.shaders['renderPassSSAO.wgsl'],
            gBufferRenderPass: gBufferRenderPass,
            canvas: canvas,
        });

        const colorRenderPass = this.colorRenderPass = new ColorRenderPass({
            canvas: canvas,
        });

        const finalRenderPass = this.finalRenderPass = new FinalRenderPass({
            code: assets.shaders['renderPassFinal.wgsl'],
            gBufferRenderPass: gBufferRenderPass,
            ssaoRenderPass: ssaoRenderPass,
            colorRenderPass: colorRenderPass,
            canvas: canvas,
        });

        const debugRenderPass = this.debugRenderPass = new DebugRenderPass({
            code: assets.shaders['debugRenderPass.wgsl'],
            canvas: canvas,
        });

        this.debugRenderPass.texture = this.ssaoRenderPass.ssaoTexture;

        callback();
    }

    static Update() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    static Render(engine) {
        const commandEncoder = this.commandEncoder = GPU.CreateCommandEncoder();

        this.gBufferRenderPass.Render(engine, commandEncoder);
        this.ssaoRenderPass.Render(engine, commandEncoder);
        this.colorRenderPass.Render(engine, commandEncoder);
        this.finalRenderPass.Render(engine, commandEncoder);
        // this.debugRenderPass.Render(engine, commandEncoder);

        GPU.Queue.submit([commandEncoder.finish()]);
    }

}