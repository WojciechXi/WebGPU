class ShadowRenderPass extends RenderPass {

    Init(data) {
        const canvas = data.canvas;

        this.shadowTexture = GPU.CreateTexture({
            size: [128, 128],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.uniformValues = new Float32Array(16);
        this.uniformBuffer = GPU.CreateBuffer({
            size: this.uniformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
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
                        ],
                    },
                ],
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "fs",
                targets: [
                ]
            },
            primitive: { topology: "triangle-list" },
            depthStencil: { format: "depth24plus" },
        });

        this.bindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
            ],
        });
    }

    Render(engine, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [], // brak, tylko depth
            depthStencilAttachment: {
                view: this.shadowTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store"
            }
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);

        this.uniformValues.set(Graphics.lightViewProjectionMatrix);
        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

        engine.Render(this);

        renderPass.end();
    }

}