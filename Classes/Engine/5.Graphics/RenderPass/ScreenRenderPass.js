class ScreenRenderPass extends RenderPass {

    Init(data) {
        const object = this;
        object.canvas = data.canvas;
        object.bindGroup = null;

        new Property(object, 'renderTexture', null, {
            assigned: function (value) {
                object.bindGroup = value ? GPU.CreateBindGroup({
                    layout: object.renderPipeline.getBindGroupLayout(0),
                    entries: [
                        value.GetBindGroupEntry(0),
                    ],
                }) : null;
            },
        })

        const format = navigator.gpu.getPreferredCanvasFormat();

        object.renderPipeline = GPU.CreateRenderPipeline({
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
                        ],
                    })
                ],
            }),
            vertex: {
                module: object.shaderModule,
                entryPoint: "vs",
                buffers: []
            },
            fragment: {
                module: object.shaderModule,
                entryPoint: "fs",
                targets: [
                    { format: format },
                ],
            },
            primitive: { topology: "triangle-list" },
        });
    }

    Render(camera, scene, commandEncoder) {
        if (!this.bindGroup) return;

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: Graphics.context.getCurrentTexture().createView(), loadOp: "load", storeOp: "store" }
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);
        renderPass.draw(6);
        renderPass.end();
    }

}