class SSAORenderPass extends RenderPass {

    Init(data) {
        const canvas = this.canvas = data.canvas;
        const gBufferRenderPass = this.gBufferRenderPass = data.gBufferRenderPass;
        const inputTextureView = this.inputTextureView = data.inputTextureView;

        this.radius = data.radius ?? 0.25;
        this.bias = data.bias ?? 0.025;
        this.blurRadius = data.blurRadius ?? 4;
        this.sigmaDepth = data.sigmaDepth ?? 0.2;

        this.ssaoTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba32float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.ssaoTextureView = this.ssaoTexture.createView();

        this.blurHorizontalTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba32float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.blurHorizontalTextureView = this.blurHorizontalTexture.createView();

        this.blurVerticalTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba32float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.blurVerticalTextureView = this.blurVerticalTexture.createView();

        this.sceneTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba32float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.sceneTextureView = this.sceneTexture.createView();

        const noise = new Float32Array(16 * 4);
        for (let i = 0; i < 16; i++) {
            noise[i * 4 + 0] = Math.random() * 2 - 1;
            noise[i * 4 + 1] = Math.random() * 2 - 1;
            noise[i * 4 + 2] = 0;
            noise[i * 4 + 3] = 0;
        }
        this.noiseTexture = GPU.CreateTexture({
            size: [4, 4, 1],
            format: "rgba32float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        this.noiseTextureView = this.noiseTexture.createView();
        GPU.Queue.writeTexture({ texture: this.noiseTexture }, noise, { bytesPerRow: 4 * 16 }, [4, 4, 1]);

        this.ssaoKernel = this.GenerateKernel(32);

        this.uniformValues = new Float32Array(this.ssaoKernel.length + 16 + 16 + 4 + 4);
        this.uniformValues.set(this.ssaoKernel, 0);
        this.uniformValues.set([this.canvas.width, this.canvas.height, this.radius, this.bias, this.blurRadius, this.sigmaDepth], this.ssaoKernel.length + 32);

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

        this.noiseSampler = GPU.CreateSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',
        });

        this.ssaoRenderPipeline = GPU.CreateRenderPipeline({
            layout: GPU.device.createPipelineLayout({
                bindGroupLayouts: [
                    GPU.device.createBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering', }, },
                            { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering', }, },
                            { binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                            { binding: 4, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                            { binding: 5, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
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
                entryPoint: "ssaoRenderPass",
                targets: [
                    { format: "rgba32float" }
                ]
            },
        });

        this.blurHorizontalRenderPipeline = GPU.CreateRenderPipeline({
            layout: GPU.device.createPipelineLayout({
                bindGroupLayouts: [
                    GPU.device.createBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering', }, },
                            { binding: 6, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
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
                entryPoint: "blurHorizontalRenderPass",
                targets: [
                    { format: "rgba32float" }
                ]
            },
        });

        this.blurVerticalRenderPipeline = GPU.CreateRenderPipeline({
            layout: GPU.device.createPipelineLayout({
                bindGroupLayouts: [
                    GPU.device.createBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering', }, },
                            { binding: 6, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
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
                entryPoint: "blurVerticalRenderPass",
                targets: [
                    { format: "rgba32float" }
                ]
            },
        });

        this.sceneRenderPipeline = GPU.CreateRenderPipeline({
            layout: GPU.device.createPipelineLayout({
                bindGroupLayouts: [
                    GPU.device.createBindGroupLayout({
                        entries: [
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" }, },
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering', }, },
                            { binding: 6, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
                            { binding: 7, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float', viewDimension: '2d', multisampled: false, }, },
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
                entryPoint: "sceneRenderPass",
                targets: [
                    { format: "rgba32float" }
                ]
            },
        });

        this.ssaoBindGroup = GPU.CreateBindGroup({
            layout: this.ssaoRenderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: this.noiseSampler },
                { binding: 3, resource: gBufferRenderPass.positionTextureView },
                { binding: 4, resource: gBufferRenderPass.normalTextureView },
                { binding: 5, resource: this.noiseTextureView },
            ],
        });

        this.blurHorizontalBindGroup = GPU.CreateBindGroup({
            layout: this.blurHorizontalRenderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 6, resource: this.ssaoTextureView },
            ],
        });

        this.blurVerticalBindGroup = GPU.CreateBindGroup({
            layout: this.blurVerticalRenderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 6, resource: this.blurHorizontalTextureView },
            ],
        });

        this.sceneBindGroup = GPU.CreateBindGroup({
            layout: this.sceneRenderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 6, resource: this.blurVerticalTextureView },
                { binding: 7, resource: this.inputTextureView },
            ],
        });
    }

    Render(engine, commandEncoder) {
        this.uniformValues.set(Camera.main.viewMatrix, this.ssaoKernel.length);
        this.uniformValues.set(Camera.main.projectionMatrix, this.ssaoKernel.length + 16);
        this.uniformValues.set([this.canvas.width, this.canvas.height, this.radius, this.bias, this.blurRadius, this.sigmaDepth], this.ssaoKernel.length + 32);

        //ssaoRenderPass
        const ssaoRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{ view: this.ssaoTextureView, loadOp: "clear", storeOp: "store" }]
        });
        ssaoRenderPass.setPipeline(this.ssaoRenderPipeline);
        ssaoRenderPass.setBindGroup(0, this.ssaoBindGroup);
        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
        ssaoRenderPass.draw(6);
        ssaoRenderPass.end();

        //blurHorizontalRenderPass
        const blurHorizontalRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{ view: this.blurHorizontalTextureView, loadOp: "clear", storeOp: "store" }]
        });
        blurHorizontalRenderPass.setPipeline(this.blurHorizontalRenderPipeline);
        blurHorizontalRenderPass.setBindGroup(0, this.blurHorizontalBindGroup);
        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
        blurHorizontalRenderPass.draw(6);
        blurHorizontalRenderPass.end();

        //blurVerticalRenderPass
        const blurVerticalRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{ view: this.blurVerticalTextureView, loadOp: "clear", storeOp: "store" }]
        });
        blurVerticalRenderPass.setPipeline(this.blurVerticalRenderPipeline);
        blurVerticalRenderPass.setBindGroup(0, this.blurVerticalBindGroup);
        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
        blurVerticalRenderPass.draw(6);
        blurVerticalRenderPass.end();

        //sceneRenderPass
        const sceneRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{ view: this.sceneTextureView, loadOp: "clear", storeOp: "store" }]
        });
        sceneRenderPass.setPipeline(this.sceneRenderPipeline);
        sceneRenderPass.setBindGroup(0, this.sceneBindGroup);
        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
        sceneRenderPass.draw(6);
        sceneRenderPass.end();
    }

    GenerateKernel(size = 64) {
        const kernel = [];

        for (let i = 0; i < size; i++) {
            let sample = new Vector3(
                Math.random() * 2.0 - 1.0,
                Math.random() * 2.0 - 1.0,
                Math.random()
            );

            sample.Normalize(sample);
            sample.Multiply(Math.random());

            kernel.push(sample[0], sample[1], sample[2], 0);
        }

        return kernel;
    }

}