class RenderPipeline {

    constructor() {
        this.shadowRenderPass = new ShadowRenderPass({
            name: 'shadowRenderPass',
            code: Resources.Load('/Resources/Shaders/shadowRenderPass.wgsl'),
        });

        this.gBufferRenderPass = new GBufferRenderPass({
            name: 'gBufferRenderPass',
        });

        this.lightingRenderPass = new LightingRenderPass({
            name: 'lightingRenderPass',
            code: Resources.Load('/Resources/Shaders/lightingRenderPass.wgsl'),
            shadowRenderPass: this.shadowRenderPass,
            gBufferRenderPass: this.gBufferRenderPass,
        });

        // this.ssaoRenderPass = new SSAORenderPass({
        //     name: 'ssaoRenderPass',
        //     code: Resources.Load('/Resources/Shaders/ssaoRenderPass.wgsl'),
        //     gBufferRenderPass: this.gBufferRenderPass,
        //     inputRenderTexture: this.lightingRenderPass.sceneRenderTexture,
        // });

        // this.bloomRenderPass = new BloomRenderPass({
        //     name: 'bloomRenderPass',
        //     code: Resources.Load('/Resources/Shaders/bloomRenderPass.wgsl'),
        //     inputRenderTexture: this.lightingRenderPass.sceneRenderTexture,
        // });

        // this.tonemappingRenderPass = new TonemappingRenderPass({
        //     name: 'tonemappingRenderPass',
        //     code: Resources.Load('/Resources/Shaders/tonemappingRenderPass.wgsl'),
        //     inputRenderTexture: this.bloomRenderPass.sceneRenderTexture,
        // });

        this.screenRenderPass = new ScreenRenderPass({
            name: 'screenRenderPass',
            code: Resources.Load('/Resources/Shaders/screenRenderPass.wgsl'),
            canvas: this.canvas,
        });
        this.screenRenderPass.renderTexture = this.gBufferRenderPass.colorRenderTexture;

        // this.gizmosRenderPass = new GizmosRenderPass({
        //     name: 'gizmosRenderPass',
        //     code: Resources.Load('/Resources/Shaders/gizmosRenderPass.wgsl'),
        //     canvas: this.canvas,
        // });

        this.renderPasses = [
            this.shadowRenderPass,
            this.gBufferRenderPass,

            // this.lightingRenderPass,
            // this.ssaoRenderPass,
            // this.bloomRenderPass,
            // this.tonemappingRenderPass,

            this.screenRenderPass,
            // this.gizmosRenderPass,
        ];
    }

    Render(camera, scene) {
        camera.SendMessage("OnPreRender");
        const commandEncoder = this.commandEncoder = GPU.CreateCommandEncoder();
        for (let renderPass of this.renderPasses) renderPass.Render(camera, scene, commandEncoder);
        camera.SendMessage("OnPostRender");
        GPU.Queue.submit([commandEncoder.finish()]);
    }

}