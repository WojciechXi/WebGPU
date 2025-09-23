class SSAORenderPass extends RenderPass {

    Init(data) {
        const canvas = data.canvas;
        const gBufferRenderPass = data.gBufferRenderPass;

        this.ssaoKernel = this.GenerateKernel(32);

        this.uniformValues = new Float32Array(16 + this.ssaoKernel.length);
        this.uniformValues.set(this.ssaoKernel, 16);

        this.ssaoTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba8unorm",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
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
                    { format: "rgba8unorm" }
                ]
            }
        });

        this.uniformBuffer = GPU.CreateBuffer({
            size: this.uniformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        this.ssaoBindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: gBufferRenderPass.positionTexture.createView() },
                { binding: 1, resource: gBufferRenderPass.normalTexture.createView() },
                { binding: 2, resource: this.sampler },
                { binding: 3, resource: { buffer: this.uniformBuffer } },
            ],
        });
    }

    Render(engine, commandEncoder) {
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{ view: this.ssaoTexture.createView(), loadOp: "clear", storeOp: "store" }]
        });

        this.uniformValues.set(Camera.main.viewProjectionInverseMatrix, 0);
        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

        renderPass.setPipeline(this.ssaoPipeline);
        renderPass.setBindGroup(0, this.ssaoBindGroup);

        renderPass.draw(6);

        renderPass.end();
    }

    GenerateKernel(size = 64) {
        const kernel = [];

        for (let i = 0; i < size; i++) {
            let sample = new Vector3(
                Math.random() * 2.0 - 1.0,
                Math.random() * 2.0 - 1.0,
                Math.random()
            );

            sample.Normalize(sample);
            sample.Multiply(Math.random());

            kernel.push(sample[0], sample[1], sample[2], 0);
        }

        return kernel;
    }

}