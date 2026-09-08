class LightingRenderPass extends RenderPass {

    Init(data) {
        this.depthRenderTexture = data.depthRenderTexture;
        this.colorRenderTexture = data.colorRenderTexture;
        this.worldNormalRenderTexture = data.worldNormalRenderTexture;
        this.pbrRenderTexture = data.pbrRenderTexture;
        this.emissiveRenderTexture = data.emissiveRenderTexture;

        this.resultRenderTexture = data.resultRenderTexture;

        this.renderPipeline = GPU.CreateRenderPipeline({
            label: 'lightingRenderPipeline',
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
                            { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering' } },
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth', viewDimension: '2d', multisampled: false, }, },
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
                    this.resultRenderTexture.GetTarget(),
                ]
            },
        });

        this.bindGroup3 = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(3),
            entries: [
                {
                    binding: 0, resource: GPU.CreateSampler({
                        addressModeU: 'clamp-to-edge',
                        addressModeV: 'clamp-to-edge',
                        magFilter: 'nearest',
                        minFilter: 'nearest',
                    })
                },
                this.depthRenderTexture.GetBindGroupEntry(1),
                this.colorRenderTexture.GetBindGroupEntry(2),
                this.worldNormalRenderTexture.GetBindGroupEntry(3),
                this.pbrRenderTexture.GetBindGroupEntry(4),
                this.emissiveRenderTexture.GetBindGroupEntry(5),
            ],
        });
    }

    Render(camera, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.resultRenderTexture.GetColorAttachment('clear', 'store', scene.ambientLight.color),
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        if (scene.directionalLight) renderPass.setBindGroup(1, scene.directionalLight.lightBindGroup);
        if (scene.ambientLight) renderPass.setBindGroup(2, scene.ambientLight.lightBindGroup);
        renderPass.setBindGroup(3, this.bindGroup3);

        renderPass.setScissorRect(this.resultRenderTexture.width * camera.rect.x, this.resultRenderTexture.height * camera.rect.y, this.resultRenderTexture.width * camera.rect.width, this.resultRenderTexture.height * camera.rect.height);
        renderPass.setBindGroup(0, camera.cameraBindGroup);
        renderPass.draw(6);

        renderPass.end();
    }

}