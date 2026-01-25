class ClearRenderPass extends RenderPass {

    Init(data) {
        this.canvas = data.canvas;

        this.sceneRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, {
            format: 'rgba16float',
        });

        this.renderPipeline = GPU.CreateRenderPipeline({
            label: 'clearRenderPipeline',
            layout: GPU.CreatePipelineLayout({
                bindGroupLayouts: [
                    GPU.CreateBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
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
            primitive: { topology: "triangle-list" },
        });
    }

    Render(cameras, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.sceneRenderTexture.GetColorAttachment(),
            ],
        });
        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, scene.ambientLight.lightBindGroup);
        renderPass.draw(6);
        renderPass.end();
    }

}