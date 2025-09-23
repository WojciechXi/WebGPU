class SSAORenderPass extends RenderPass {

    Init(data) {
        const canvas = data.canvas;
        const gBufferRenderPass = data.gBufferRenderPass;

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
            },
        });

        const noise = new Float32Array(16 * 4);
        for (let i = 0; i < 16; i++) {
            noise[i * 4 + 0] = Math.random() * 2 - 1;
            noise[i * 4 + 1] = Math.random() * 2 - 1;
            noise[i * 4 + 2] = 0;
            noise[i * 4 + 3] = 0;
        }
        const noiseTex = GPU.CreateTexture({
            size: [4, 4, 1],
            format: "rgba16float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        GPU.Queue.writeTexture({ texture: noiseTex }, noise, { bytesPerRow: 4 * 16 }, [4, 4, 1]);

        this.ssaoKernel = this.GenerateKernel(64);

        this.uniformValues = new Float32Array(4 + 16 + this.ssaoKernel.length);
        this.uniformValues.set([0.1, 0.025, canvas.width, canvas.height]); //radius / bias / screen size
        this.uniformValues.set(this.ssaoKernel, 20);

        this.uniformBuffer = GPU.CreateBuffer({
            size: this.uniformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.ssaoTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba8unorm",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        this.noiseSampler = GPU.CreateSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',
        });

        this.bindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: gBufferRenderPass.viewPositionTexture.createView() },
                { binding: 2, resource: gBufferRenderPass.viewNormalTexture.createView() },
                { binding: 3, resource: this.sampler },
                { binding: 4, resource: noiseTex.createView() },
                { binding: 5, resource: this.noiseSampler },
            ],
        });
    }

    Render(engine, commandEncoder) {
        this.uniformValues.set(Camera.main.projectionMatrix, 4);
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{ view: this.ssaoTexture.createView(), loadOp: "clear", storeOp: "store" }]
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);

        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

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