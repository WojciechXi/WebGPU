class BloomRenderPass extends RenderPass {

    Init(data) {
        this.canvas = data.canvas;
        this.inputRenderTexture = data.inputRenderTexture;

        this.brightRenderTexture = new RenderTexture(this.canvas.width / 2, this.canvas.height / 2, { format: 'rgba16float', });
        this.blurRenderTexture = new RenderTexture(this.canvas.width / 4, this.canvas.height / 4, { format: 'rgba16float', });
        this.bloomRenderTexture = new RenderTexture(this.canvas.width / 4, this.canvas.height / 4, { format: 'rgba16float', });
        this.sceneRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'rgba16float', });

        this.brightRenderPipeline = GPU.CreateRenderPipeline({
            label: 'brightRenderPipeline',
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
            label: 'blurRenderPipeline',
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
            label: 'bloomRenderPipeline',
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
            label: 'sceneRenderPipeline',
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

    Render(cameras, scene, commandEncoder) {
        //brightRenderPass
        const brightRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.brightRenderTexture.GetColorAttachment(),
            ],
        });
        brightRenderPass.setPipeline(this.brightRenderPipeline);
        for (const camera of cameras) {
            brightRenderPass.setScissorRect(this.brightRenderTexture.width * camera.rect.x, this.brightRenderTexture.height * camera.rect.y, this.brightRenderTexture.width * camera.rect.width, this.brightRenderTexture.height * camera.rect.height);
            brightRenderPass.setBindGroup(0, this.brightBindGroup);
            brightRenderPass.draw(6);
        }
        brightRenderPass.end();

        //blurRenderPass
        const blurRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.blurRenderTexture.GetColorAttachment(),
            ],
        });
        blurRenderPass.setPipeline(this.blurRenderPipeline);
        for (const camera of cameras) {
            blurRenderPass.setScissorRect(this.blurRenderTexture.width * camera.rect.x, this.blurRenderTexture.height * camera.rect.y, this.blurRenderTexture.width * camera.rect.width, this.blurRenderTexture.height * camera.rect.height);
            blurRenderPass.setBindGroup(0, this.blurBindGroup);
            blurRenderPass.draw(6);
        }
        blurRenderPass.end();

        //bloomRenderPass
        const bloomRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.bloomRenderTexture.GetColorAttachment(),
            ],
        });
        bloomRenderPass.setPipeline(this.bloomRenderPipeline);
        for (const camera of cameras) {
            bloomRenderPass.setScissorRect(this.bloomRenderTexture.width * camera.rect.x, this.bloomRenderTexture.height * camera.rect.y, this.bloomRenderTexture.width * camera.rect.width, this.bloomRenderTexture.height * camera.rect.height);
            bloomRenderPass.setBindGroup(0, this.bloomBindGroup);
            bloomRenderPass.draw(6);
        }
        bloomRenderPass.end();

        //sceneRenderPass
        const sceneRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.sceneRenderTexture.GetColorAttachment(),
            ],
        });
        sceneRenderPass.setPipeline(this.sceneRenderPipeline);
        for (const camera of cameras) {
            sceneRenderPass.setScissorRect(this.sceneRenderTexture.width * camera.rect.x, this.sceneRenderTexture.height * camera.rect.y, this.sceneRenderTexture.width * camera.rect.width, this.sceneRenderTexture.height * camera.rect.height);
            sceneRenderPass.setBindGroup(0, this.sceneBindGroup);
            sceneRenderPass.draw(6);
        }
        sceneRenderPass.end();
    }

}