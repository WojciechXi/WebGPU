class GizmosRenderPass extends RenderPass {

    Init(data) {
        this.canvas = data.canvas;

        this.depthRenderTarget = new RenderTexture(this.canvas.width, this.canvas.height, {
            format: 'depth24plus',
        });

        this.transformBuffer = new UniformBuffer(16);

        this.renderPipeline = GPU.CreateRenderPipeline({
            label: 'GizmosRenderPipeline',
            layout: GPU.CreatePipelineLayout({
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
            depthStencil: {
                format: this.depthRenderTarget.format, depthWriteEnabled: false, depthCompare: 'always'
            },
        });

        this.transformBindGroup = GPU.CreateBindGroup({
            label: 'TransformBindGroup',
            layout: Graphics.transformBindGroupLayout,
            entries: [
                this.transformBuffer.GetBindGroupEntry(0),
            ],
        });
    }

    Render(cameras, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: Graphics.context.getCurrentTexture().createView(),
                    loadOp: "load",
                    storeOp: "store",
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                },
            ],
            depthStencilAttachment: this.depthRenderTarget.GetDepthStencilAttachment(),
        });

        renderPass.setPipeline(this.renderPipeline);

        renderPass.setBindGroup(0, camera.cameraBindGroup);
        renderPass.setBindGroup(1, this.transformBindGroup);

        for (let component of scene.gizmos) component.OnDrawGizmos(this);

        renderPass.end();
    }

}