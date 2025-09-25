class SSAOBlurRenderPass extends RenderPass {

    Init(data) {
        this.canvas = data.canvas;
        this.ssaoRenderPass = data.ssaoRenderPass;

        this.radius = data.radius ?? 4;
        this.sigmaDepth = data.sigmaDepth ?? 0.1;

        this.uniformValues = new Float32Array(8);
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
                    { format: "rgba16float" },
                ]
            },
        });

        this.ssaoBlurTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.ssaoBlurTextureView = this.ssaoBlurTexture.createView();

        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        this.bindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.ssaoRenderPass.ssaoTextureView },
                { binding: 2, resource: this.sampler },
            ],
        });

        this.secondBindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.ssaoBlurTextureView },
                { binding: 2, resource: this.sampler },
            ],
        });
    }

    Render(engine, commandEncoder) {
        this.uniformValues.set([this.radius, this.sigmaDepth, this.canvas.width, this.canvas.height, true], 0);

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.ssaoBlurTexture, loadOp: "clear", storeOp: "store" },
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);

        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

        renderPass.draw(6);

        renderPass.end();

        this.uniformValues.set([this.radius, this.sigmaDepth, this.canvas.width, this.canvas.height, false], 0);

        const secondRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.ssaoRenderPass.ssaoTextureView, loadOp: "clear", storeOp: "store" },
            ],
        });

        secondRenderPass.setPipeline(this.renderPipeline);
        secondRenderPass.setBindGroup(0, this.secondBindGroup);

        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

        secondRenderPass.draw(6);

        secondRenderPass.end();
    }

}