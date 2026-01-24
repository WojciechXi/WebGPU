class TonemappingRenderPass extends RenderPass {

    Init(data) {
        this.inputRenderTexture = data.inputRenderTexture;
        this.canvas = data.canvas;

        const format = navigator.gpu.getPreferredCanvasFormat();

        this.sceneRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: format, });

        this.renderPipeline = GPU.CreateRenderPipeline({
            layout: GPU.device.createPipelineLayout({
                bindGroupLayouts: [
                    GPU.device.createBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering', }, },
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
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
                    { format: format, }
                ]
            }
        });

        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'nearest',
            minFilter: 'nearest',
            mipmapFilter: 'nearest',
        });

        const bindGroup = this.bindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.sampler },
                this.inputRenderTexture.GetBindGroupEntry(1),
            ],
        });
    }

    Render(camera, scene, commandEncoder) {
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.sceneRenderTexture.GetColorAttachment(),
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);

        renderPass.draw(6);
        renderPass.end();
    }

}