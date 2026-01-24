class LightingRenderPass extends RenderPass {

    Init(data) {
        const canvas = data.canvas;
        const shadowRenderPass = data.shadowRenderPass;
        const gBufferRenderPass = data.gBufferRenderPass;

        this.sceneTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.sceneTextureView = this.sceneTexture.createView();

        this.uniformValues = new Float32Array(16 + 16 + 4 + 4 + 4);
        this.uniformBuffer = GPU.CreateBuffer({
            size: this.uniformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const pipelineLayout = GPU.device.createPipelineLayout({
            bindGroupLayouts: [
                GPU.device.createBindGroupLayout({
                    entries: [
                        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
                    ],
                }),
                GPU.device.createBindGroupLayout({
                    entries: [
                        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
                    ],
                }),
                GPU.device.createBindGroupLayout({
                    entries: [
                        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
                    ],
                }),
                GPU.device.createBindGroupLayout({
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
        });

        this.renderPipeline = GPU.CreateRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "fs",
                targets: [
                    { format: "rgba16float" }
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
                { binding: 1, resource: gBufferRenderPass.positionTextureView },
                { binding: 2, resource: gBufferRenderPass.normalTextureView },
                { binding: 3, resource: gBufferRenderPass.colorTextureView },
                { binding: 4, resource: gBufferRenderPass.pbrTextureView },
                { binding: 5, resource: shadowRenderPass.shadowTextureView },
            ],
        });
    }

    Render(camera, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.sceneTextureView, loadOp: "clear", storeOp: "store" }
            ],
        });

        renderPass.setPipeline(this.renderPipeline);

        renderPass.setBindGroup(0, camera.cameraBindGroup);
        renderPass.setBindGroup(1, DirectionalLight.main.lightBindGroup);
        renderPass.setBindGroup(2, scene.ambientLight.lightBindGroup);
        renderPass.setBindGroup(3, this.bindGroup3);

        renderPass.draw(6);

        renderPass.end();
    }

}