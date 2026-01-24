class ClearRenderPass extends RenderPass {

    Init(data) {
        const canvas = data.canvas;

        this.sceneTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.sceneTextureView = this.sceneTexture.createView();

        const pipelineLayout = GPU.device.createPipelineLayout({
            bindGroupLayouts: [
                GPU.device.createBindGroupLayout({
                    entries: [
                        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
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
            primitive: { topology: "triangle-list" },
        });
    }

    Render(camera, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.sceneTextureView, loadOp: "clear", storeOp: "store" },
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, scene.ambientLight.lightBindGroup);

        renderPass.draw(6);
        renderPass.end();
    }

}