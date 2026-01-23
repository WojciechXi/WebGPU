class ScreenSpaceReflectionRenderPass extends RenderPass {

    Init(data) {
        this.inputTextureView = data.inputTextureView;
        const gBufferRenderPass = this.gBufferRenderPass = data.gBufferRenderPass;
        this.canvas = data.canvas;

        const format = navigator.gpu.getPreferredCanvasFormat();

        this.sceneTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.sceneTextureView = this.sceneTexture.createView();

        this.uniformValues = new Float32Array(8);
        this.uniformBuffer = GPU.CreateBuffer({
            size: this.uniformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.renderPipeline = GPU.CreateRenderPipeline({
            layout: 'auto',
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
            magFilter: 'nearest',
            minFilter: 'nearest',
            mipmapFilter: 'nearest',
        });

        const bindGroup = this.bindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.gBufferRenderPass.positionTextureView },
                { binding: 2, resource: this.gBufferRenderPass.normalTextureView },
                { binding: 3, resource: this.inputTextureView },
                { binding: 4, resource: this.sampler },
            ],
        });
    }

    Render(camera, scene, commandEncoder) {
        this.uniformValues.set(Camera.main.transform.position, 0);

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