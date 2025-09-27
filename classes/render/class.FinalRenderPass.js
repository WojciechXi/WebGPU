class FinalRenderPass extends RenderPass {

    Init(data) {
        const clearRenderPass = this.clearRenderPass = data.clearRenderPass;

        this.gBufferRenderPass = data.gBufferRenderPass;
        this.lightingRenderPass = data.lightingRenderPass;
        this.forwardRenderPass = data.forwardRenderPass;
        this.ssaoRenderPass = data.ssaoRenderPass;
        this.canvas = data.canvas;

        this.uniformValues = new Float32Array(4);
        this.uniformValues.set([this.canvas.width, this.canvas.height]); //radius / bias / screen size

        this.sceneTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.sceneTextureView = this.sceneTexture.createView();

        this.uniformBuffer = GPU.CreateBuffer({
            size: this.uniformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.renderPipeline = GPU.CreateRenderPipeline({
            layout: "auto",
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "fs",
                targets: [
                    { format: 'rgba16float', }
                ],
            }
        });

        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        const bindGroup = this.bindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.clearRenderPass.colorTextureView },
                { binding: 2, resource: this.lightingRenderPass.lightingTextureView },
                { binding: 3, resource: this.gBufferRenderPass.depthTextureView },
                { binding: 4, resource: this.forwardRenderPass.colorTextureView },
                { binding: 5, resource: this.forwardRenderPass.depthTextureView },
                { binding: 6, resource: this.ssaoRenderPass.ssaoTextureView },
                { binding: 7, resource: this.sampler },
            ],
        });
    }

    Render(engine, commandEncoder) {
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.sceneTextureView, // wyświetlamy na ekranie
                    loadOp: "clear",
                    storeOp: "store"
                }
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);

        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

        renderPass.draw(6);
        renderPass.end();
    }

}