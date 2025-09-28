class BloomRenderPass extends RenderPass {

    Init(data) {
        this.canvas = data.canvas;
        this.inputTextureView = data.inputTextureView;

        this.brightTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: 'rgba32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.brightTextureView = this.brightTexture.createView();

        this.blurTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: 'rgba32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.blurTextureView = this.blurTexture.createView();

        this.bloomTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: 'rgba32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.bloomTextureView = this.bloomTexture.createView();

        this.brightRenderPipeline = GPU.CreateRenderPipeline({
            layout: GPU.device.createPipelineLayout({
                bindGroupLayouts: [
                    GPU.device.createBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering', }, },
                            { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                        ],
                    })
                ],
            }),
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "brightRenderPass",
                targets: [
                    { format: 'rgba32float', }
                ]
            }
        });

        this.blurRenderPipeline = GPU.CreateRenderPipeline({
            layout: GPU.device.createPipelineLayout({
                bindGroupLayouts: [
                    GPU.device.createBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering', }, },
                            { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                        ],
                    })
                ],
            }),
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "blurRenderPass",
                targets: [
                    { format: 'rgba32float', }
                ]
            }
        });

        this.bloomRenderPipeline = GPU.CreateRenderPipeline({
            layout: GPU.device.createPipelineLayout({
                bindGroupLayouts: [
                    GPU.device.createBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering', }, },
                            { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                        ],
                    })
                ],
            }),
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "bloomRenderPass",
                targets: [
                    { format: 'rgba32float', }
                ]
            }
        });

        this.uniformValues = new Float32Array(4);
        this.uniformValues.set([this.canvas.width, this.canvas.height]); //screen size
        this.uniformBuffer = GPU.CreateBuffer({
            size: this.uniformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'nearest',
            minFilter: 'nearest',
            mipmapFilter: 'nearest',
        });

        const brightBindGroup = this.brightBindGroup = GPU.CreateBindGroup({
            layout: this.brightRenderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: this.inputTextureView },
            ],
        });

        const blurBindGroup = this.blurBindGroup = GPU.CreateBindGroup({
            layout: this.blurRenderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: this.brightTextureView },
            ],
        });

        const bloomBindGroup = this.bloomBindGroup = GPU.CreateBindGroup({
            layout: this.bloomRenderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: this.brightTextureView },
            ],
        });
    }

    Render(engine, commandEncoder) {
        this.uniformValues.set([this.canvas.width, this.canvas.height]); //screen size

        //brightRenderPass
        const brightRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.brightTextureView, // wyświetlamy na ekranie
                    loadOp: "clear",
                    storeOp: "store"
                }
            ],
        });

        brightRenderPass.setPipeline(this.brightRenderPipeline);
        brightRenderPass.setBindGroup(0, this.brightBindGroup);

        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

        brightRenderPass.draw(6);
        brightRenderPass.end();

        //blurRenderPass
        const blurRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.blurTextureView, // wyświetlamy na ekranie
                    loadOp: "clear",
                    storeOp: "store"
                }
            ],
        });

        blurRenderPass.setPipeline(this.blurRenderPipeline);
        blurRenderPass.setBindGroup(0, this.blurBindGroup);

        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

        blurRenderPass.draw(6);
        blurRenderPass.end();

        //bloomRenderPass
        const bloomRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.bloomTextureView, // wyświetlamy na ekranie
                    loadOp: "clear",
                    storeOp: "store"
                }
            ],
        });

        bloomRenderPass.setPipeline(this.bloomRenderPipeline);
        bloomRenderPass.setBindGroup(0, this.bloomBindGroup);

        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);

        bloomRenderPass.draw(6);
        bloomRenderPass.end();
    }

}