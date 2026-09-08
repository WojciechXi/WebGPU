class TonemappingRenderPass extends RenderPass {

    Init(data) {
        this.inputRenderTexture = data.inputRenderTexture;
        this.resultRenderTexture = data.resultRenderTexture;

        this.renderPipeline = GPU.CreateRenderPipeline({
            label: 'tonemappingRenderPipeline',
            layout: GPU.CreatePipelineLayout({
                bindGroupLayouts: [
                    GPU.CreateBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering', }, },
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, },
                            { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                        ],
                    })
                ],
            }),
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "fs",
                targets: [
                    this.resultRenderTexture.GetTarget(),
                ]
            }
        });

        this.paramsBuffer = new Buffer(4);

        new Property(this, 'exposure', 1, {
            assigned: value => {
                this.paramsBuffer.Set({
                    0: [value],
                });
            },
        });

        new Property(this, 'gamma', 2.2, {
            assigned: value => {
                this.paramsBuffer.Set({
                    1: [value],
                });
            },
        });

        this.bindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: GPU.CreateSampler({ addressModeU: 'repeat', addressModeV: 'repeat', magFilter: 'nearest', minFilter: 'nearest', mipmapFilter: 'nearest', }), },
                this.paramsBuffer.GetBindGroupEntry(1),
                this.inputRenderTexture.GetBindGroupEntry(2),
            ],
        });
    }

    Render(camera, scene, commandEncoder) {
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.resultRenderTexture.GetColorAttachment(),
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);
        renderPass.draw(6);
        renderPass.end();
    }

}