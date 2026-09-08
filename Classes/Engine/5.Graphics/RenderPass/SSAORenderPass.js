class ssaoRenderPass extends RenderPass {

    Init(data) {
        this.depthRenderTexture = data.depthRenderTexture;
        this.worldNormalRenderTexture = data.worldNormalRenderTexture;

        this.ssaoRenderTexture = new RenderTexture(Mathf.FloorToInt(Graphics.Width / 4), Mathf.FloorToInt(Graphics.Height / 4), {
            format: 'r8unorm',
        });

        this.resultRenderTexture = data.resultRenderTexture;

        this.buffer = new Buffer(4);

        new Property(this, 'radius', 0.25, {
            assigned: value => this.buffer.Set({ 0: [value] }),
        });

        new Property(this, 'bias', 0.025, {
            assigned: value => this.buffer.Set({ 1: [value] }),
        });

        new Property(this, 'intensity', 0.25, {
            assigned: value => this.buffer.Set({ 2: [value] }),
        });

        new Property(this, 'sampleCount', 32, {
            assigned: value => this.buffer.Set({ 3: [value] }),
        });

        this.bindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'ssaoBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering' } },
                { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth', viewDimension: '2d', multisampled: false, }, },
                { binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
            ],
        });

        this.bindGroup = GPU.CreateBindGroup({
            label: 'ssaoBingGroup',
            layout: this.bindGroupLayout,
            entries: [
                this.buffer.GetBindGroupEntry(0),
                { binding: 1, resource: GPU.CreateSampler({ addressModeU: 'repeat', addressModeV: 'repeat', magFilter: 'nearest', minFilter: 'nearest', mipmapFilter: 'nearest', }), },
                this.depthRenderTexture.GetBindGroupEntry(2),
                this.worldNormalRenderTexture.GetBindGroupEntry(3),
            ],
        });

        this.renderPipeline = GPU.CreateRenderPipeline({
            label: 'ssaoRenderPipeline',
            layout: GPU.CreatePipelineLayout({
                label: 'ssaoPipelineLayout',
                bindGroupLayouts: [
                    Graphics.viewBindGroupLayout,
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
            },
            primitive: {
                topology: 'triangle-list'
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
        renderPass.setBindGroup(0, camera.cameraBindGroup);
        renderPass.setBindGroup(1, this.bindGroup);

        renderPass.draw(6);
        renderPass.end();
    }

}