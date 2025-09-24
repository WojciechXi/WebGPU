class LightingRenderPass extends RenderPass {

    Init(data) {
        const canvas = data.canvas;
        const gBufferRenderPass = data.gBufferRenderPass;

        this.lightingTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.uniformValues = new Float32Array(4 + 4 + 4);
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
                    { format: "rgba16float" }
                ]
            },
        });

        this.bindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: gBufferRenderPass.screenPositionTexture.createView() },
                { binding: 2, resource: gBufferRenderPass.screenNormalTexture.createView() },
                { binding: 3, resource: gBufferRenderPass.colorTexture.createView() },
                { binding: 4, resource: gBufferRenderPass.pbrTexture.createView() },
            ],
        });
    }

    Render(engine, commandEncoder) {
        this.uniformValues.set(Graphics.ambientLightColor, 0);
        this.uniformValues.set(Graphics.lightColor, 4);
        this.uniformValues.set(Graphics.lightDirection, 8);

        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.lightingTexture.createView(), loadOp: "clear", storeOp: "store" }
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);

        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

        renderPass.draw(6);

        renderPass.end();
    }

}