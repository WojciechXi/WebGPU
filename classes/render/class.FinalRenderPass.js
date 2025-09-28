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

        const bindGroupLayout = GPU.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
                { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering', }, },
                { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                { binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                { binding: 4, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                { binding: 5, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                { binding: 6, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
            ],
        });

        const pipelineLayout = GPU.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
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
                    { format: 'rgba32float', }
                ],
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
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: this.clearRenderPass.colorTextureView },
                { binding: 3, resource: this.lightingRenderPass.sceneTextureView },
                { binding: 4, resource: this.gBufferRenderPass.depthTextureView },
                { binding: 5, resource: this.forwardRenderPass.colorTextureView },
                { binding: 6, resource: this.forwardRenderPass.depthTextureView },
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