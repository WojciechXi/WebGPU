class BloomRenderPass extends RenderPass {

    Init(data) {
        this.canvas = data.canvas;
        this.inputRenderTexture = data.inputRenderTexture;

        this.brightRenderTexture = new RenderTexture(this.canvas.width / 2, this.canvas.height / 2, { format: 'rgba16float', });
        this.blurRenderTexture = new RenderTexture(this.canvas.width / 4, this.canvas.height / 4, { format: 'rgba16float', });
        this.bloomRenderTexture = new RenderTexture(this.canvas.width / 4, this.canvas.height / 4, { format: 'rgba16float', });
        this.sceneRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'rgba16float', });

        this.brightRenderPipeline = GPU.CreateRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "brightRenderPass",
                targets: [
                    this.brightRenderTexture.GetTarget(),
                ]
            }
        });

        this.blurRenderPipeline = GPU.CreateRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "blurRenderPass",
                targets: [
                    this.blurRenderTexture.GetTarget(),
                ]
            }
        });

        this.bloomRenderPipeline = GPU.CreateRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "bloomRenderPass",
                targets: [
                    this.bloomRenderTexture.GetTarget(),
                ]
            }
        });

        this.sceneRenderPipeline = GPU.CreateRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "sceneRenderPass",
                targets: [
                    this.sceneRenderTexture.GetTarget(),
                ]
            }
        });

        this.sampler = GPU.CreateSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        this.brightBindGroup = GPU.CreateBindGroup({
            layout: this.brightRenderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.sampler },
                this.inputRenderTexture.GetBindGroupEntry(1),
            ],
        });

        this.blurBindGroup = GPU.CreateBindGroup({
            layout: this.blurRenderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.sampler },
                this.brightRenderTexture.GetBindGroupEntry(1),
            ],
        });

        this.bloomBindGroup = GPU.CreateBindGroup({
            layout: this.bloomRenderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.sampler },
                this.blurRenderTexture.GetBindGroupEntry(1),
            ],
        });

        this.sceneBindGroup = GPU.CreateBindGroup({
            layout: this.sceneRenderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.sampler },
                this.bloomRenderTexture.GetBindGroupEntry(1),
                this.inputRenderTexture.GetBindGroupEntry(2),
            ],
        });
    }

    Render(camera, scene, commandEncoder) {
        //brightRenderPass
        const brightRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.brightRenderTexture.GetColorAttachment(),
            ],
        });

        brightRenderPass.setPipeline(this.brightRenderPipeline);
        brightRenderPass.setBindGroup(0, this.brightBindGroup);

        brightRenderPass.draw(6);
        brightRenderPass.end();

        //blurRenderPass
        const blurRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.blurRenderTexture.GetColorAttachment(),
            ],
        });

        blurRenderPass.setPipeline(this.blurRenderPipeline);
        blurRenderPass.setBindGroup(0, this.blurBindGroup);

        blurRenderPass.draw(6);
        blurRenderPass.end();

        //bloomRenderPass
        const bloomRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.bloomRenderTexture.GetColorAttachment(),
            ],
        });

        bloomRenderPass.setPipeline(this.bloomRenderPipeline);
        bloomRenderPass.setBindGroup(0, this.bloomBindGroup);

        bloomRenderPass.draw(6);
        bloomRenderPass.end();

        //sceneRenderPass
        const sceneRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.sceneRenderTexture.GetColorAttachment(),
            ],
        });

        sceneRenderPass.setPipeline(this.sceneRenderPipeline);
        sceneRenderPass.setBindGroup(0, this.sceneBindGroup);

        sceneRenderPass.draw(6);
        sceneRenderPass.end();
    }

}