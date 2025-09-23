class FinalRenderPass extends RenderPass {

    Init() {
        const format = navigator.gpu.getPreferredCanvasFormat();

        this.renderPipeline = GPU.CreateRenderPipeline({
            layout: "auto",
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "fs",
                targets: [{ format }]
            }
        });
    }

}