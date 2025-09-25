class LightingRenderPass extends RenderPass {

    Init(data) {
        const canvas = data.canvas;
        const shadowRenderPass = data.shadowRenderPass;
        const gBufferRenderPass = data.gBufferRenderPass;

        this.lightingTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.lightingTextureView = this.lightingTexture.createView();

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
                { binding: 1, resource: shadowRenderPass.depthTextureView },
                { binding: 2, resource: gBufferRenderPass.screenPositionTextureView },
                { binding: 3, resource: gBufferRenderPass.screenNormalTextureView },
                { binding: 4, resource: gBufferRenderPass.colorTextureView },
                { binding: 5, resource: gBufferRenderPass.pbrTextureView },
            ],
        });
    }

    Render(engine, commandEncoder) {
        this.uniformValues.set(Graphics.ambientLightColor, 0);
        this.uniformValues.set(Graphics.lightColor, 4);
        this.uniformValues.set(Graphics.lightDirection, 8);

        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.lightingTextureView, loadOp: "clear", storeOp: "store" }
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);

        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

        renderPass.draw(6);

        renderPass.end();
    }

}