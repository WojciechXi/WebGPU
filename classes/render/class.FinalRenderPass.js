class FinalRenderPass extends RenderPass {

    Init(data) {
        const gBufferRenderPass = data.gBufferRenderPass;
        const ssaoRenderPass = data.ssaoRenderPass;
        const canvas = data.canvas;

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

        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        const finalBindGroup = this.finalBindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: gBufferRenderPass.positionTexture.createView() },
                { binding: 1, resource: gBufferRenderPass.normalTexture.createView() },
                { binding: 2, resource: ssaoRenderPass.ssaoTexture.createView() },
                { binding: 3, resource: this.sampler },
            ],
        });
    }

}