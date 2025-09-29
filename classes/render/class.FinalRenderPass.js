class FinalRenderPass extends RenderPass {

    Init(data) {
        const clearRenderPass = this.clearRenderPass = data.clearRenderPass;

        this.gBufferRenderPass = data.gBufferRenderPass;
        this.lightingRenderPass = data.lightingRenderPass;
        this.forwardRenderPass = data.forwardRenderPass;
        this.sceneTextureView = data.sceneTextureView;
        this.canvas = data.canvas;

        this.uniformValues = new Float32Array(4);
        this.uniformValues.set([this.canvas.width, this.canvas.height]); //radius / bias / screen size

        this.uniformBuffer = GPU.CreateBuffer({
            size: this.uniformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.renderPipeline = GPU.CreateRenderPipeline({
            layout: GPU.device.createPipelineLayout({
                bindGroupLayouts: [
                    GPU.device.createBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {}, },
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: {}, },
                            { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering', }, },
                            { binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                            { binding: 4, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                            { binding: 5, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                            { binding: 6, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                            { binding: 7, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
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
                    { format: 'rgba16float', }
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

        const bindGroup = this.bindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: this.depthSampler },
                { binding: 3, resource: this.clearRenderPass.colorTextureView },
                { binding: 4, resource: this.lightingRenderPass.sceneTextureView },
                { binding: 5, resource: this.gBufferRenderPass.depthTextureView },
                { binding: 6, resource: this.forwardRenderPass.colorTextureView },
                { binding: 7, resource: this.forwardRenderPass.depthTextureView },
            ],
        });
    }

    Render(engine, commandEncoder) {
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.sceneTextureView, // wyświetlamy na ekranie
                    loadOp: "clear",
                    storeOp: "store"
                }
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);

        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

        renderPass.draw(6);
        renderPass.end();
    }

}