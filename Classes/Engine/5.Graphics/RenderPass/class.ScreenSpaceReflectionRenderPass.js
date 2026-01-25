class ScreenSpaceReflectionRenderPass extends RenderPass {

    Init(data) {
        this.inputRenderTexture = data.inputRenderTexture;
        this.gBufferRenderPass = data.gBufferRenderPass;
        this.canvas = data.canvas;

        const format = navigator.gpu.getPreferredCanvasFormat();

        this.sceneRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, {
            format: format,
        });

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
                    this.sceneRenderTexture.GetTarget(),
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
                this.gBufferRenderPass.positionRenderTexture.GetBindGroupEntry(1),
                this.gBufferRenderPass.normalRenderTexture.GetBindGroupEntry(2),
                this.inputRenderTexture.GetBindGroupEntry(3),
                { binding: 4, resource: this.sampler },
            ],
        });
    }

    Render(cameras, scene, commandEncoder) {
        this.uniformValues.set(Camera.main.transform.position, 0);
        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

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