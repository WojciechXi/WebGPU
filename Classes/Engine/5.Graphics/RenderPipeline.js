class RenderPipeline {

    constructor() {
        // this.shadowRenderPass = new ShadowRenderPass({
        //     name: 'shadowRenderPass',
        //     code: Resources.Get('/Resources/Shaders/shadowRenderPass.wgsl'),
        //     canvas: this.canvas,
        // });

        this.gBufferRenderPass = new GBufferRenderPass({
            name: 'gBufferRenderPass',
            canvas: this.canvas,
        });

        // this.lightingRenderPass = new LightingRenderPass({
        //     name: 'lightingRenderPass',
        //     code: Resources.Get('/Resources/Shaders/lightingRenderPass.wgsl'),
        //     shadowRenderPass: this.shadowRenderPass,
        //     gBufferRenderPass: this.gBufferRenderPass,
        //     canvas: this.canvas,
        // });

        // this.ssaoRenderPass = new SSAORenderPass({
        //     name: 'ssaoRenderPass',
        //     code: Resources.Get('/Resources/Shaders/ssaoRenderPass.wgsl'),
        //     gBufferRenderPass: this.gBufferRenderPass,
        //     inputRenderTexture: this.lightingRenderPass.sceneRenderTexture,
        //     canvas: this.canvas,
        // });

        // this.bloomRenderPass = new BloomRenderPass({
        //     name: 'bloomRenderPass',
        //     code: Resources.Get('/Resources/Shaders/bloomRenderPass.wgsl'),
        //     inputRenderTexture: this.lightingRenderPass.sceneRenderTexture,
        //     canvas: this.canvas,
        // });

        // this.tonemappingRenderPass = new TonemappingRenderPass({
        //     name: 'tonemappingRenderPass',
        //     code: Resources.Get('/Resources/Shaders/tonemappingRenderPass.wgsl'),
        //     inputRenderTexture: this.bloomRenderPass.sceneRenderTexture,
        //     canvas: this.canvas,
        // });

        this.screenRenderPass = new ScreenRenderPass({
            name: 'screenRenderPass',
            code: Resources.Get('/Resources/Shaders/screenRenderPass.wgsl'),
            canvas: this.canvas,
        });
        this.screenRenderPass.renderTexture = this.gBufferRenderPass.normalRenderTexture;

        // this.gizmosRenderPass = new GizmosRenderPass({
        //     name: 'gizmosRenderPass',
        //     code: Resources.Get('/Resources/Shaders/gizmosRenderPass.wgsl'),
        //     canvas: this.canvas,
        // });

        this.renderPasses = [
            // this.shadowRenderPass,
            this.gBufferRenderPass,

            // this.lightingRenderPass,
            // this.forwardRenderPass,
            // this.finalRenderPass,

            // this.ssaoRenderPass,
            // this.screenSpaceReflectionRenderPass,
            // this.bloomRenderPass,
            // this.tonemappingRenderPass,

            this.screenRenderPass,
            // this.gizmosRenderPass,
        ];
    }

    Render(camera, scene, commandEncoder) {
        for (let renderPass of this.renderPasses) renderPass.Render(camera, scene, commandEncoder);
    }

}