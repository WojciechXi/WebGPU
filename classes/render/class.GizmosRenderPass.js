class GizmosRenderPass extends RenderPass {

    static {
        this.color = Color.black;
        this.matrix = Matrix4x4.Identity();
    }

    Init(data) {
        this.canvas = data.canvas;

        this.depthTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.depthTextureView = this.depthTexture.createView();

        this.uniformValues = new Float32Array(16 + 16 + 16 + 4);
        this.uniformBuffer = GPU.CreateBuffer({
            size: this.uniformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.renderPipeline = GPU.CreateRenderPipeline({
            layout: 'auto',
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

        this.bindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
            ],
        });
    }

    Render(engine, commandEncoder) {
        this.uniformValues.set(Matrix4x4.Identity(GizmosRenderPass.matrix), 0);
        this.uniformValues.set(Camera.main.viewMatrix, 16);
        this.uniformValues.set(Camera.main.projectionMatrix, 32);
        this.uniformValues.set(GizmosRenderPass.color, 48);
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
        renderPass.setBindGroup(0, this.bindGroup);

        engine.Render(this);

        renderPass.end();
    }

    SetMatrix(matrix4x4) {
        this.uniformValues.set(matrix4x4, 0);
        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
    }

    SetColor(color) {
        this.uniformValues.set(color, 48);
        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
    }

}