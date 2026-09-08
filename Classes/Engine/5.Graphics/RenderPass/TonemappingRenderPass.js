class TonemappingRenderPass extends RenderPass {

    Init(data) {
        this.inputRenderTexture = data.inputRenderTexture;
        this.resultRenderTexture = data.resultRenderTexture;

        this.paramsBuffer = new Buffer(4);

        new Property(this, 'exposure', 1, {
            assigned: value => {
                this.paramsBuffer.Set({
                    0: [value],
                });
            },
        });

        new Property(this, 'gamma', 2.2, {
            assigned: value => {
                this.paramsBuffer.Set({
                    1: [value],
                });
            },
        });


        this.bindGroupLayout = GPU.CreateBindGroupLayout({
            entries: [
                this.sampler.GetBindGroupLayoutEntry(0),
                this.paramsBuffer.GetBindGroupLayoutEntry(1),
                this.inputRenderTexture.GetBindGroupLayoutEntry(2),
            ],
        });

        this.bindGroup = GPU.CreateBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                this.sampler.GetBindGroupEntry(0),
                this.paramsBuffer.GetBindGroupEntry(1),
                this.inputRenderTexture.GetBindGroupEntry(2),
            ],
        });

        this.renderPipeline = GPU.CreateRenderPipeline({
            label: 'tonemappingRenderPipeline',
            layout: GPU.CreatePipelineLayout({
                bindGroupLayouts: [
                    this.bindGroupLayout,
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
            }
        });
    }

    Render(camera, scene, commandEncoder) {
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.resultRenderTexture.GetColorAttachment(),
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.bindGroup);
        renderPass.draw(6);
        renderPass.end();
    }

}