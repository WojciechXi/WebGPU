class ssgiRenderPass extends RenderPass {

    Init(data) {
        this.depthRenderTexture = data.depthRenderTexture;
        this.colorRenderTexture = data.colorRenderTexture;
        this.worldNormalRenderTexture = data.worldNormalRenderTexture;
        this.pbrRenderTexture = data.pbrRenderTexture;
        this.emissiveRenderTexture = data.emissiveRenderTexture;

        this.ssgiRenderTexture = new RenderTexture(Mathf.FloorToInt(Graphics.Width / 4), Mathf.FloorToInt(Graphics.Height / 4), {
            format: 'rgba16float',
        });

        this.resultRenderTexture = data.resultRenderTexture;

        this.buffer = new Buffer(12);

        new Property(this, 'raysPerPixel', 4, {
            assigned: value => this.buffer.Set({ 0: [value] }),
        });

        new Property(this, 'maxSteps', 4, {
            assigned: value => this.buffer.Set({ 1: [value] }),
        });

        new Property(this, 'stepSize', 0.02, {
            assigned: value => this.buffer.Set({ 2: [value] }),
        });

        new Property(this, 'thickness', 0.5, {
            assigned: value => this.buffer.Set({ 3: [value] }),
        });

        new Property(this, 'bias', 0.025, {
            assigned: value => this.buffer.Set({ 4: [value] }),
        });

        new Property(this, 'maxDistance', 10, {
            assigned: value => this.buffer.Set({ 5: [value] }),
        });

        new Property(this, 'intensity', 2, {
            assigned: value => this.buffer.Set({ 6: [value] }),
        });

        new Property(this, 'useJitter', false, {
            assigned: value => this.buffer.Set({ 7: [value] }),
        });

        new Property(this, 'edgeFade', 0.1, {
            assigned: value => this.buffer.Set({ 8: [value] }),
        });

        this.ssgiBindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'ssgiBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering' } },
                { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth', viewDimension: '2d', multisampled: false, }, },
                { binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                { binding: 4, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                { binding: 5, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                { binding: 6, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
            ],
        });

        this.bindGroup = GPU.CreateBindGroup({
            label: 'ssgiBingGroup',
            layout: this.ssgiBindGroupLayout,
            entries: [
                this.buffer.GetBindGroupEntry(0),
                { binding: 1, resource: GPU.CreateSampler({ addressModeU: 'repeat', addressModeV: 'repeat', magFilter: 'nearest', minFilter: 'nearest', mipmapFilter: 'nearest', }), },
                this.depthRenderTexture.GetBindGroupEntry(2),
                this.colorRenderTexture.GetBindGroupEntry(3),
                this.worldNormalRenderTexture.GetBindGroupEntry(4),
                this.pbrRenderTexture.GetBindGroupEntry(5),
                this.emissiveRenderTexture.GetBindGroupEntry(6),
            ],
        });

        this.renderPipeline = GPU.CreateRenderPipeline({
            label: 'ssgiRenderPipeline',
            layout: GPU.CreatePipelineLayout({
                label: 'ssgiPipelineLayout',
                bindGroupLayouts: [
                    Graphics.timeBindGroupLayout,
                    Graphics.viewBindGroupLayout,
                    this.ssgiBindGroupLayout,
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
        renderPass.setBindGroup(0, Graphics.timeBindGroup);
        renderPass.setBindGroup(1, camera.cameraBindGroup);
        renderPass.setBindGroup(2, this.bindGroup);

        renderPass.draw(6);
        renderPass.end();
    }

}