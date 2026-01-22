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

        this.uniformValues = new Float32Array(16 + 16 + 16 + 16 + 16 + 16 + 4 + 4 + 4);
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

        this.bindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: gBufferRenderPass.positionTextureView },
                { binding: 3, resource: gBufferRenderPass.normalTextureView },
                { binding: 4, resource: gBufferRenderPass.colorTextureView },
                { binding: 5, resource: gBufferRenderPass.pbrTextureView },
                { binding: 6, resource: shadowRenderPass.depthTextureView },
            ],
        });
    }

    Render(camera, engine, commandEncoder) {
        this.uniformValues.set(Camera.main.transform.matrix4x4, 0);
        this.uniformValues.set(Camera.main.viewMatrix, 16);
        this.uniformValues.set(Camera.main.projectionMatrix, 32);
        this.uniformValues.set(DirectionalLight.main.viewMatrix, 48);
        this.uniformValues.set(DirectionalLight.main.projectionMatrix, 64);
        this.uniformValues.set(DirectionalLight.main.color, 80);
        this.uniformValues.set(DirectionalLight.main.shadowColor, 84);
        this.uniformValues.set(AmbientLight.main.color, 88);

        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.sceneTextureView, loadOp: "clear", storeOp: "store" }
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);

        renderPass.draw(6);

        renderPass.end();
    }

}