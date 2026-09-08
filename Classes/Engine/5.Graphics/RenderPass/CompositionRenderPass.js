class CompositionRenderPass extends RenderPass {

    Init(data) {
        this.colorRenderTexture = data.colorRenderTexture;
        this.lightingRenderTexture = data.lightingRenderTexture;
        this.ssaoRenderTexture = data.ssaoRenderTexture;
        this.ssgiRenderTexture = data.ssgiRenderTexture;

        this.resultRenderTexture = data.resultRenderTexture;

        this.renderPipeline = GPU.CreateRenderPipeline({
            label: 'CompositionRenderPipeline',
            layout: GPU.CreatePipelineLayout({
                label: 'CompositionPipelineLayout',
                bindGroupLayouts: [
                    GPU.CreateBindGroupLayout({
                        label: 'CompositionBindGroupLayout',
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering' } },
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                            { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                            { binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                            { binding: 4, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                        ],
                    }),
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
            },
            primitive: {
                topology: 'triangle-list'
            }
        });

        this.bindGroup = GPU.CreateBindGroup({
            label: 'CompositionBingGroup',
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: GPU.CreateSampler({ addressModeU: 'repeat', addressModeV: 'repeat', magFilter: 'nearest', minFilter: 'nearest', mipmapFilter: 'nearest', }), },
                this.colorRenderTexture.GetBindGroupEntry(1),
                this.lightingRenderTexture.GetBindGroupEntry(2),
                this.ssaoRenderTexture.GetBindGroupEntry(3),
                this.ssgiRenderTexture.GetBindGroupEntry(4),
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