class GBufferRenderPass extends RenderPass {

    Init(canvas) {
        this.positionTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.normalTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.depthTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.renderPipeline = GPU.CreateRenderPipeline({
            layout: "auto",
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs",
                buffers: [
                    {
                        arrayStride: (3 + 3 + 3 + 2) * 4, // position + normal + color + uv
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x3' },       // position
                            { shaderLocation: 1, offset: 3 * 4, format: 'float32x3' },   // normal
                            { shaderLocation: 2, offset: 6 * 4, format: 'float32x3' },   // color
                            { shaderLocation: 3, offset: 9 * 4, format: 'float32x2' },   // uv
                        ],
                    },
                ],
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "fs",
                targets: [
                    { format: "rgba16float" }, // positionTexture
                    { format: "rgba16float" }, // normalTexture
                ]
            },
            depthStencil: {
                format: "depth24plus",
                depthWriteEnabled: true,
                depthCompare: "less"
            }
        });
    }

    Render(engine, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.positionTexture.createView(), loadOp: "clear", storeOp: "store" },
                { view: this.normalTexture.createView(), loadOp: "clear", storeOp: "store" },
            ],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store"
            }
        });

        renderPass.setPipeline(this.renderPipeline);
        engine.Render(renderPass, this.renderPipeline);
        renderPass.end();
    }

}