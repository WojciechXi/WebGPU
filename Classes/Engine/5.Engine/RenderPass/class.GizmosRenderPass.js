class GizmosRenderPass extends RenderPass {

    Init(data) {
        this.canvas = data.canvas;

        this.depthTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.depthTextureView = this.depthTexture.createView();

        this.uniformValues = new Float32Array(16 + 16);
        this.uniformBuffer = GPU.CreateBuffer({
            size: this.uniformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

        this.transformValues = new Float32Array(16);
        this.transformBuffer = GPU.CreateBuffer({
            size: this.transformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        GPU.Queue.writeBuffer(this.transformBuffer, 0, this.transformValues);

        this.renderPipeline = GPU.CreateRenderPipeline({
            label: 'GizmosRenderPipeline',
            layout: GPU.device.createPipelineLayout({
                bindGroupLayouts: [
                    Graphics.viewBindGroupLayout,
                    Graphics.transformBindGroupLayout
                ],
            }),
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs",
                buffers: [
                    {
                        arrayStride: (4 + 4 + 4 + 4 + 4) * 4, // position + normal + tangent + color + uv
                        attributes: [
                            { shaderLocation: 0, offset: 0 * 4, format: 'float32x3' }, // position
                            { shaderLocation: 1, offset: 4 * 4, format: 'float32x3' }, // normal
                            { shaderLocation: 2, offset: 8 * 4, format: 'float32x4' }, // tangent
                            { shaderLocation: 3, offset: 12 * 4, format: 'float32x4' }, // color
                            { shaderLocation: 4, offset: 16 * 4, format: 'float32x2' }, // uv
                        ],
                    },
                ],
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "fs",
                targets: [
                    { format: 'bgra8unorm', }
                ],
            },
            primitive: { topology: 'line-list' },
            depthStencil: { format: 'depth24plus', depthWriteEnabled: false, depthCompare: 'always' },
        });

        this.viewBindGroup = GPU.CreateBindGroup({
            label: 'ViewBindGroup',
            layout: Graphics.viewBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
            ],
        });

        this.transformBindGroup = GPU.CreateBindGroup({
            label: 'TransformBindGroup',
            layout: Graphics.transformBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.transformBuffer } },
            ],
        });
    }

    Render(engine, commandEncoder) {
        this.uniformValues.set(Camera.main.viewMatrix, 0);
        this.uniformValues.set(Camera.main.projectionMatrix, 16);
        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: Graphics.context.getCurrentTexture().createView(),
                    loadOp: "load",
                    storeOp: "store",
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                },
            ],
            depthStencilAttachment: {
                view: this.depthTextureView,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
                depthClearValue: 1.0,
            },
        });

        renderPass.setPipeline(this.renderPipeline);

        renderPass.setBindGroup(0, this.viewBindGroup);
        renderPass.setBindGroup(1, this.transformBindGroup);

        engine.Render(this);

        renderPass.end();
    }

}