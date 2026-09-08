class ssgiRenderPass extends RenderPass {

    Init(data) {
        this.depthRenderTexture = data.depthRenderTexture;
        this.colorRenderTexture = data.colorRenderTexture;
        this.worldNormalRenderTexture = data.worldNormalRenderTexture;
        this.pbrRenderTexture = data.pbrRenderTexture;
        this.emissiveRenderTexture = data.emissiveRenderTexture;

        this.ssgiRenderTexture = new RenderTexture(Mathf.FloorToInt(Graphics.Width / 2), Mathf.FloorToInt(Graphics.Height / 2), {
            format: 'rgba16float',
        });

        this.ssgiHorizontalRenderTexture = new RenderTexture(Mathf.FloorToInt(Graphics.Width / 2), Mathf.FloorToInt(Graphics.Height / 2), {
            format: 'rgba16float',
        });

        this.resultRenderTexture = data.resultRenderTexture;

        this.ssgiBuffer = new Buffer(12);

        this.bindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'ssgiBindGroupLayout',
            entries: [
                this.ssgiBuffer.GetBindGroupLayoutEntry(0),
                this.samplerPoint.GetBindGroupLayoutEntry(1),
                this.depthRenderTexture.GetBindGroupLayoutEntry(2, GPUShaderStage.FRAGMENT, 'depth'),
                this.colorRenderTexture.GetBindGroupLayoutEntry(3, GPUShaderStage.FRAGMENT, 'unfilterable-float'),
                this.worldNormalRenderTexture.GetBindGroupLayoutEntry(4, GPUShaderStage.FRAGMENT, 'unfilterable-float'),
                this.pbrRenderTexture.GetBindGroupLayoutEntry(5, GPUShaderStage.FRAGMENT, 'unfilterable-float'),
                this.emissiveRenderTexture.GetBindGroupLayoutEntry(6, GPUShaderStage.FRAGMENT, 'unfilterable-float'),
            ],
        });

        this.bindGroup = GPU.CreateBindGroup({
            label: 'ssgiBingGroup',
            layout: this.bindGroupLayout,
            entries: [
                this.ssgiBuffer.GetBindGroupEntry(0),
                this.samplerPoint.GetBindGroupEntry(1),
                this.depthRenderTexture.GetBindGroupEntry(2),
                this.colorRenderTexture.GetBindGroupEntry(3),
                this.worldNormalRenderTexture.GetBindGroupEntry(4),
                this.pbrRenderTexture.GetBindGroupEntry(5),
                this.emissiveRenderTexture.GetBindGroupEntry(6),
            ],
        });

        let ssgiShaderModule = GPU.CreateShaderModule({ code: data.ssgiRenderPass });
        this.renderPipeline = GPU.CreateRenderPipeline({
            label: 'ssgiRenderPipeline',
            layout: GPU.CreatePipelineLayout({
                label: 'ssgiPipelineLayout',
                bindGroupLayouts: [
                    Graphics.timeBindGroupLayout,
                    Graphics.viewBindGroupLayout,
                    this.bindGroupLayout,
                ],
            }),
            vertex: {
                module: ssgiShaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: ssgiShaderModule,
                entryPoint: "fs",
                targets: [
                    this.ssgiRenderTexture.GetTarget(),
                ]
            },
            primitive: {
                topology: 'triangle-list'
            }
        });

        this.horizontalBindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'ssgiHorizontalBindGroupLayout',
            entries: [
                this.samplerPoint.GetBindGroupLayoutEntry(0),
                this.depthRenderTexture.GetBindGroupLayoutEntry(1, GPUShaderStage.FRAGMENT, 'depth'),
                this.sampler.GetBindGroupLayoutEntry(2),
                this.ssgiRenderTexture.GetBindGroupLayoutEntry(3),
                this.worldNormalRenderTexture.GetBindGroupLayoutEntry(4, GPUShaderStage.FRAGMENT, 'unfilterable-float'),
            ],
        });

        this.horizontalBindGroup = GPU.CreateBindGroup({
            label: 'ssgiHorizontalBingGroup',
            layout: this.horizontalBindGroupLayout,
            entries: [
                this.samplerPoint.GetBindGroupEntry(0),
                this.depthRenderTexture.GetBindGroupEntry(1),
                this.sampler.GetBindGroupEntry(2),
                this.ssgiRenderTexture.GetBindGroupEntry(3),
                this.worldNormalRenderTexture.GetBindGroupEntry(4),
            ],
        });

        let ssgiHorizontalShaderModule = GPU.CreateShaderModule({ code: data.ssgiHorizontalRenderPass });
        this.horizontalRenderPipeline = GPU.CreateRenderPipeline({
            label: 'ssgiHorizontalRenderPipeline',
            layout: GPU.CreatePipelineLayout({
                label: 'ssgiHorizontalPipelineLayout',
                bindGroupLayouts: [
                    Graphics.viewBindGroupLayout,
                    this.horizontalBindGroupLayout,
                ],
            }),
            vertex: {
                module: ssgiHorizontalShaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: ssgiHorizontalShaderModule,
                entryPoint: "fs",
                targets: [
                    this.ssgiHorizontalRenderTexture.GetTarget(),
                ]
            },
            primitive: {
                topology: 'triangle-list'
            }
        });

        this.verticalBindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'ssgiVerticalBindGroupLayout',
            entries: [
                this.samplerPoint.GetBindGroupLayoutEntry(0),
                this.depthRenderTexture.GetBindGroupLayoutEntry(1, GPUShaderStage.FRAGMENT, 'depth'),
                this.sampler.GetBindGroupLayoutEntry(2),
                this.ssgiHorizontalRenderTexture.GetBindGroupLayoutEntry(3),
                this.worldNormalRenderTexture.GetBindGroupLayoutEntry(4, GPUShaderStage.FRAGMENT, 'unfilterable-float'),
            ],
        });

        this.verticalBindGroup = GPU.CreateBindGroup({
            label: 'ssgiVerticalBingGroup',
            layout: this.verticalBindGroupLayout,
            entries: [
                this.samplerPoint.GetBindGroupEntry(0),
                this.depthRenderTexture.GetBindGroupEntry(1),
                this.sampler.GetBindGroupEntry(2),
                this.ssgiHorizontalRenderTexture.GetBindGroupEntry(3),
                this.worldNormalRenderTexture.GetBindGroupEntry(4),
            ],
        });

        let ssgiVerticalShaderModule = GPU.CreateShaderModule({ code: data.ssgiVerticalRenderPass });
        this.verticalRenderPipeline = GPU.CreateRenderPipeline({
            label: 'ssgiVerticalRenderPipeline',
            layout: GPU.CreatePipelineLayout({
                label: 'ssgiVerticalPipelineLayout',
                bindGroupLayouts: [
                    Graphics.viewBindGroupLayout,
                    this.verticalBindGroupLayout,
                ],
            }),
            vertex: {
                module: ssgiVerticalShaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: ssgiVerticalShaderModule,
                entryPoint: "fs",
                targets: [
                    this.resultRenderTexture.GetTarget(),
                ]
            },
            primitive: {
                topology: 'triangle-list'
            }
        });

        new Property(this, 'raysPerPixel', 4, {
            assigned: value => this.ssgiBuffer.Set({ 0: [value] }),
        });

        new Property(this, 'maxSteps', 4, {
            assigned: value => this.ssgiBuffer.Set({ 1: [value] }),
        });

        new Property(this, 'stepSize', 0.02, {
            assigned: value => this.ssgiBuffer.Set({ 2: [value] }),
        });

        new Property(this, 'thickness', 0.125, {
            assigned: value => this.ssgiBuffer.Set({ 3: [value] }),
        });

        new Property(this, 'bias', 0.025, {
            assigned: value => this.ssgiBuffer.Set({ 4: [value] }),
        });

        new Property(this, 'maxDistance', 10, {
            assigned: value => this.ssgiBuffer.Set({ 5: [value] }),
        });

        new Property(this, 'intensity', 2, {
            assigned: value => this.ssgiBuffer.Set({ 6: [value] }),
        });

        new Property(this, 'useJitter', false, {
            assigned: value => this.ssgiBuffer.Set({ 7: [value] }),
        });

        new Property(this, 'edgeFade', 0.0, {
            assigned: value => this.ssgiBuffer.Set({ 8: [value] }),
        });
    }

    Render(camera, scene, commandEncoder) {
        //SSGI pass

        let renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.ssgiRenderTexture.GetColorAttachment(),
            ],
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, Graphics.timeBindGroup);
        renderPass.setBindGroup(1, camera.cameraBindGroup);
        renderPass.setBindGroup(2, this.bindGroup);

        renderPass.draw(6);
        renderPass.end();

        // Horizontal pass

        renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.ssgiHorizontalRenderTexture.GetColorAttachment(),
            ],
        });

        renderPass.setPipeline(this.horizontalRenderPipeline);
        renderPass.setBindGroup(0, camera.cameraBindGroup);
        renderPass.setBindGroup(1, this.horizontalBindGroup);

        renderPass.draw(6);
        renderPass.end();

        // Vertical pass

        renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.resultRenderTexture.GetColorAttachment(),
            ],
        });

        renderPass.setPipeline(this.verticalRenderPipeline);
        renderPass.setBindGroup(0, camera.cameraBindGroup);
        renderPass.setBindGroup(1, this.verticalBindGroup);

        renderPass.draw(6);
        renderPass.end();
    }

}