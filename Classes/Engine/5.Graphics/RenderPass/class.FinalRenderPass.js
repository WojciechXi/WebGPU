class FinalRenderPass extends RenderPass {

    Init(data) {
        this.clearRenderPass = data.clearRenderPass;

        this.gBufferRenderPass = data.gBufferRenderPass;
        this.lightingRenderPass = data.lightingRenderPass;
        this.sceneRenderTexture = data.sceneRenderTexture;
        this.canvas = data.canvas;

        this.screenBuffer = new UniformBuffer(4);
        this.screenBuffer.Set({
            0: [this.canvas.width, this.canvas.height],
        });

        this.renderPipeline = GPU.CreateRenderPipeline({
            layout: GPU.CreatePipelineLayout({
                bindGroupLayouts: [
                    GPU.CreateBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {}, },
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: {}, },
                            { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering', }, },
                            { binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                            { binding: 4, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                            { binding: 5, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
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
                    this.sceneRenderTexture.GetTarget(),
                ],
            }
        });

        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        this.depthSampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'nearest',
            minFilter: 'nearest',
            mipmapFilter: 'nearest',
        });

        this.bindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                this.screenBuffer.GetBindGroupEntry(0),
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: this.depthSampler },
                this.clearRenderPass.sceneRenderTexture.GetBindGroupEntry(3),
                this.lightingRenderPass.sceneRenderTexture.GetBindGroupEntry(4),
                this.gBufferRenderPass.depthRenderTexture.GetBindGroupEntry(5),
            ],
        });
    }

    Render(cameras, scene, commandEncoder) {
        this.screenBuffer.Set({
            0: [this.canvas.width, this.canvas.height],
        });

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.sceneRenderTexture.GetColorAttachment(),
            ],
        });
        renderPass.setScissorRect(this.canvas.width * camera.rect.x, this.canvas.height * camera.rect.y, this.canvas.width * camera.rect.width, this.canvas.height * camera.rect.height);

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);

        renderPass.draw(6);
        renderPass.end();
    }

}