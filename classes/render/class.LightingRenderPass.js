class LightingRenderPass extends RenderPass {

    Init(data) {
        const canvas = data.canvas;
        const shadowRenderPass = data.shadowRenderPass;
        const gBufferRenderPass = data.gBufferRenderPass;

        this.lightingTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.lightingTextureView = this.lightingTexture.createView();

        this.uniformValues = new Float32Array(16 + 16 + 16 + 16 + 16 + 4 + 4 + 4); //ambientLightColor, lightColor, lightViewMatrix, lightProjectionMatrix
        this.uniformBuffer = GPU.CreateBuffer({
            size: this.uniformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.renderPipeline = GPU.CreateRenderPipeline({
            layout: "auto",
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
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        this.bindGroup = GPU.CreateBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: shadowRenderPass.depthTextureView },
                { binding: 3, resource: gBufferRenderPass.positionTextureView },
                { binding: 4, resource: gBufferRenderPass.normalTextureView },
                { binding: 5, resource: gBufferRenderPass.colorTextureView },
                { binding: 6, resource: gBufferRenderPass.pbrTextureView },
            ],
        });
    }

    Render(engine, commandEncoder) {
        this.uniformValues.set(Camera.main.viewMatrix, 0);
        this.uniformValues.set(Camera.main.inverseViewMatrix, 16);
        this.uniformValues.set(Camera.main.projectionMatrix, 32);
        this.uniformValues.set(DirectionalLight.main.viewMatrix, 48);
        this.uniformValues.set(DirectionalLight.main.projectionMatrix, 64);
        this.uniformValues.set(DirectionalLight.main.color, 80);
        this.uniformValues.set(DirectionalLight.main.shadowColor, 84);
        this.uniformValues.set(AmbientLight.main.color, 88);

        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.lightingTextureView, loadOp: "clear", storeOp: "store" }
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);

        renderPass.draw(6);

        renderPass.end();
    }

}