class Graphics {

    static {
        this.lightViewProjectionMatrix = Matrix4x4.Identity();
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

        const clearRenderPass = this.clearRenderPass = new ClearRenderPass({
            name: 'clearRenderPass',
            code: assets.shaders['clearRenderPass.wgsl'],
            canvas: canvas,
        });

        const shadowRenderPass = this.shadowRenderPass = new ShadowRenderPass({
            name: 'shadowRenderPass',
            canvas: canvas,
        });

        const gBufferRenderPass = this.gBufferRenderPass = new GBufferRenderPass({
            name: 'gBufferRenderPass',
            code: assets.shaders['gBufferRenderPass.wgsl'],
            canvas: canvas,
        });

        const lightingRenderPass = this.lightingRenderPass = new LightingRenderPass({
            name: 'lightingRenderPass',
            code: assets.shaders['lightingRenderPass.wgsl'],
            shadowRenderPass: shadowRenderPass,
            gBufferRenderPass: gBufferRenderPass,
            canvas: canvas,
        });

        const forwardRenderPass = this.forwardRenderPass = new ForwardRenderPass({
            name: 'forwardRenderPass',
            code: assets.shaders['forwardRenderPass.wgsl'],
            lightingRenderPass: lightingRenderPass,
            canvas: canvas,
        });

        const ssaoRenderPass = this.ssaoRenderPass = new SSAORenderPass({
            name: 'ssaoRenderPass',
            code: assets.shaders['ssaoRenderPass.wgsl'],
            gBufferRenderPass: gBufferRenderPass,
            canvas: canvas,
            radius: 0.5,
            bias: 0.05,
        });

        const ssaoBlurRenderPass = this.ssaoBlurRenderPass = new SSAOBlurRenderPass({
            radius: 4,
            sigmaDepth: 0.3,
            name: 'ssaoBlurRenderPass',
            code: assets.shaders['ssaoBlurRenderPass.wgsl'],
            ssaoRenderPass: ssaoRenderPass,
            canvas: canvas,
        });

        const finalRenderPass = this.finalRenderPass = new FinalRenderPass({
            name: 'finalRenderPass',
            code: assets.shaders['finalRenderPass.wgsl'],
            clearRenderPass: clearRenderPass,
            gBufferRenderPass: gBufferRenderPass,
            lightingRenderPass: lightingRenderPass,
            forwardRenderPass: forwardRenderPass,
            ssaoRenderPass: ssaoRenderPass,
            canvas: canvas,
        });

        const debugRenderPass = this.debugRenderPass = new DebugRenderPass({
            name: 'debugRenderPass',
            code: assets.shaders['debugRenderPass.wgsl'],
            canvas: canvas,
        });

        this.debugRenderPass.textureView = this.gBufferRenderPass.colorTextureView;

        callback();
    }

    static Update() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    static Render(engine) {
        const commandEncoder = this.commandEncoder = GPU.CreateCommandEncoder();

        this.clearRenderPass.Render(engine, commandEncoder);
        // this.shadowRenderPass.Render(engine, commandEncoder);

        this.gBufferRenderPass.Render(engine, commandEncoder);

        // this.ssaoRenderPass.Render(engine, commandEncoder);
        // this.ssaoBlurRenderPass.Render(engine, commandEncoder);

        // this.lightingRenderPass.Render(engine, commandEncoder);
        // this.forwardRenderPass.Render(engine, commandEncoder);
        // this.finalRenderPass.Render(engine, commandEncoder);

        this.debugRenderPass.Render(engine, commandEncoder);

        GPU.Queue.submit([commandEncoder.finish()]);
    }

}