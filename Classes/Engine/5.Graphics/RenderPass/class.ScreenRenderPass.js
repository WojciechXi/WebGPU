class ScreenRenderPass extends RenderPass {

    Init(data) {
        this._renderTexture = null;
        this.canvas = data.canvas;

        const format = navigator.gpu.getPreferredCanvasFormat();

        this.renderPipeline = GPU.CreateRenderPipeline({
            label: 'screenRenderPipeline',
            layout: GPU.CreatePipelineLayout({
                bindGroupLayouts: [
                    GPU.CreateBindGroupLayout({
                        entries: [
                            {
                                binding: 0,
                                visibility: GPUShaderStage.FRAGMENT,
                                texture: {
                                    sampleType: 'unfilterable-float',
                                    viewDimension: '2d',
                                    multisampled: false,
                                },
                            },
                            {
                                binding: 1,
                                visibility: GPUShaderStage.FRAGMENT,
                                sampler: {
                                    type: 'non-filtering',
                                },
                            },
                        ],
                    })
                ],
            }),
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs",
                buffers: []
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "fs",
                targets: [
                    { format: format },
                ],
            },
            primitive: { topology: "triangle-list" },
        });

        this.sampler = GPU.CreateSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',
        });

        this.bindGroup = null;
    }

    get renderTexture() {
        return this._renderTexture;
    }

    set renderTexture(renderTexture) {
        this._renderTexture = renderTexture;

        this.bindGroup = this._renderTexture ? GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                this.renderTexture.GetBindGroupEntry(0),
                { binding: 1, resource: this.sampler, },
            ],
        }) : null;
    }

    Render(cameras, scene, commandEncoder) {
        if (!this.bindGroup) return;

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: Graphics.context.getCurrentTexture().createView(),
                    loadOp: "load",
                    storeOp: "store"
                }
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);
        renderPass.draw(6);
        renderPass.end();
    }

}