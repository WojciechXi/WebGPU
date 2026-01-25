class LightingRenderPass extends RenderPass {

    Init(data) {
        const canvas = data.canvas;
        const shadowRenderPass = this.shadowRenderPass = data.shadowRenderPass;
        const gBufferRenderPass = this.gBufferRenderPass = data.gBufferRenderPass;

        this.sceneRenderTexture = new RenderTexture(canvas.width, canvas.height, { format: 'rgba16float', });

        this.renderPipeline = GPU.CreateRenderPipeline({
            layout: GPU.CreatePipelineLayout({
                bindGroupLayouts: [
                    GPU.CreateBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
                        ],
                    }),
                    GPU.CreateBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
                        ],
                    }),
                    GPU.CreateBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
                        ],
                    }),
                    GPU.CreateBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering', }, },
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                            { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                            { binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                            { binding: 4, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                            { binding: 5, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
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
                    this.sceneRenderTexture.GetTarget(),
                ]
            },
        });

        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'nearest',
            minFilter: 'nearest',
            mipmapFilter: 'nearest',
        });

        this.bindGroup3 = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(3),
            entries: [
                { binding: 0, resource: this.sampler },
                this.gBufferRenderPass.positionRenderTexture.GetBindGroupEntry(1),
                this.gBufferRenderPass.normalRenderTexture.GetBindGroupEntry(2),
                this.gBufferRenderPass.colorRenderTexture.GetBindGroupEntry(3),
                this.gBufferRenderPass.pbrRenderTexture.GetBindGroupEntry(4),
                this.shadowRenderPass.depthRenderTexture.GetBindGroupEntry(5),
            ],
        });
    }

    Render(cameras, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.sceneRenderTexture.GetColorAttachment(),
            ],
        });
        renderPass.setScissorRect(this.canvas.width * camera.rect.x, this.canvas.height * camera.rect.y, this.canvas.width * camera.rect.width, this.canvas.height * camera.rect.height);

        renderPass.setPipeline(this.renderPipeline);

        renderPass.setBindGroup(0, camera.cameraBindGroup);
        renderPass.setBindGroup(1, scene.directionalLight.lightBindGroup);
        renderPass.setBindGroup(2, scene.ambientLight.lightBindGroup);
        renderPass.setBindGroup(3, this.bindGroup3);

        renderPass.draw(6);

        renderPass.end();
    }

}