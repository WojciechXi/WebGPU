class RenderPipeline {

    async Init() {
        this.screenRenderPass = new ScreenRenderPass({
            name: 'screenRenderPass',
            code: await Resources.Load('Shaders/screenRenderPass.wgsl'),
            canvas: this.canvas,
        });

        this.inputRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'rgba8unorm',
        });

        this.outputRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'rgba8unorm',
        });

        this.depthRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'depth24plus',
            depth: true,
        });

        this.colorRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'rgba8unorm',
        });

        this.worldNormalRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'rgba8unorm',
        });

        this.pbrRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'rgba8unorm',
        });

        this.emissiveRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'rgba8unorm',
        });

        this.lightingRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'rgba8unorm',
        });

        this.ssaoRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'rgba8unorm',
        });

        this.bloomRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'rgba8unorm',
        });

        this.tonemappingRenderTexture = new RenderTexture(Graphics.Width, Graphics.Height, {
            format: 'rgba8unorm',
        });

        this.screenRenderPass.renderTexture = this.tonemappingRenderTexture;

        this.preDepthRenderPass = new PreDepthRenderPass({
            name: 'preDepthRenderPass',

            depthRenderTexture: this.depthRenderTexture,
        });

        this.shadowRenderPass = new ShadowRenderPass({
            name: 'shadowRenderPass',
            code: await Resources.Load('Shaders/depthRenderPass.wgsl'),
        });

        this.gBufferRenderPass = new GBufferRenderPass({
            name: 'gBufferRenderPass',

            depthRenderTexture: this.depthRenderTexture,
            colorRenderTexture: this.colorRenderTexture,
            worldNormalRenderTexture: this.worldNormalRenderTexture,
            pbrRenderTexture: this.pbrRenderTexture,
            emissiveRenderTexture: this.emissiveRenderTexture,
        });

        // this.ssaoRenderPass = new SSAORenderPass({
        //     name: 'ssaoRenderPass',
        //     code: await Resources.Load('Shaders/ssaoRenderPass.wgsl'),

        //     depthRenderTexture: this.depthRenderTexture,
        //     worldNormalRenderTexture: this.worldNormalRenderTexture,

        //     resultRenderTexture: this.ssaoRenderTexture,
        // });

        this.lightingRenderPass = new LightingRenderPass({
            name: 'lightingRenderPass',
            code: await Resources.Load('Shaders/lightingRenderPass.wgsl'),
            shadowRenderPass: this.shadowRenderPass,

            depthRenderTexture: this.depthRenderTexture,
            colorRenderTexture: this.colorRenderTexture,
            worldNormalRenderTexture: this.worldNormalRenderTexture,
            pbrRenderTexture: this.pbrRenderTexture,
            emissiveRenderTexture: this.emissiveRenderTexture,
            ssaoRenderTexture: this.ssaoRenderTexture,

            resultRenderTexture: this.lightingRenderTexture,
        });

        this.bloomRenderPass = new BloomRenderPass({
            name: 'bloomRenderPass',
            code: await Resources.Load('Shaders/bloomRenderPass.wgsl'),

            inputRenderTexture: this.lightingRenderTexture,
            resultRenderTexture: this.bloomRenderTexture,
        });

        this.tonemappingRenderPass = new TonemappingRenderPass({
            name: 'tonemappingRenderPass',
            code: await Resources.Load('Shaders/tonemappingRenderPass.wgsl'),

            inputRenderTexture: this.bloomRenderTexture,
            resultRenderTexture: this.tonemappingRenderTexture,
        });

        // this.gizmosRenderPass = new GizmosRenderPass({
        //     name: 'gizmosRenderPass',
        //     code: await Resources.Load('Shaders/gizmosRenderPass.wgsl'),
        //     canvas: this.canvas,
        // });

        this.renderPasses = [
            this.preDepthRenderPass,
            this.shadowRenderPass,
            this.gBufferRenderPass,
            // this.ssaoRenderPass,

            this.lightingRenderPass,
            this.bloomRenderPass,
            this.tonemappingRenderPass,

            this.screenRenderPass,
            // this.gizmosRenderPass,
        ];
    }

    SwitchRenderTextures() {
        const inputRenderTexture = this.inputRenderTexture;
        const outputRenderTexture = this.outputRenderTexture;
        this.inputRenderTexture = outputRenderTexture;
        this.outputRenderTexture = inputRenderTexture;
    }

    Render(camera, scene) {
        camera.SendMessage("OnPreRender");
        const commandEncoder = this.commandEncoder = GPU.CreateCommandEncoder();
        for (let renderPass of this.renderPasses) renderPass.Render(camera, scene, commandEncoder);
        camera.SendMessage("OnPostRender");
        GPU.Queue.submit([commandEncoder.finish()]);
    }

}