class Graphics {

    static {
        this.lightDirection = Vector3.down;
        this.lightColor = Color.white;
        this.ambientLightColor = Color.zero;
    }

    static get Width() { return this.canvas.width; }
    static get Height() { return this.canvas.height; }

    static async Init(assets, callback) {
        const device = GPU.device;
        const canvas = this.canvas = document.querySelector('canvas');
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        const context = this.context = canvas.getContext('webgpu');

        const format = navigator.gpu.getPreferredCanvasFormat();
        context.configure({ device, format });

        this.ssaoKernel = this.GenerateKernel(32);

        const finalShaderModule = GPU.CreateShaderModule({ code: assets.shaders['Final.wgsl'] });

        //sampler
        const sampler = this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        const gBufferTextures = this.gBufferTextures = {
            color: GPU.CreateTexture({
                size: [canvas.width, canvas.height],
                format: "rgba16float",
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
            }),
            position: GPU.CreateTexture({
                size: [canvas.width, canvas.height],
                format: "rgba16float",
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
            }),
            normal: GPU.CreateTexture({
                size: [canvas.width, canvas.height],
                format: "rgba16float",
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
            }),
            depth: GPU.CreateTexture({
                size: [canvas.width, canvas.height],
                format: "depth24plus",
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
            })
        };

        const ssaoTexture = this.ssaoTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba8unorm",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        //gBuffer
        const gBufferShaderModule = GPU.CreateShaderModule({ code: assets.shaders['gBuffer.wgsl'] });
        const gBufferPipeline = this.gBufferPipeline = GPU.CreateRenderPipeline({
            layout: "auto",
            vertex: {
                module: gBufferShaderModule,
                entryPoint: "vs",
                buffers: [
                    {
                        arrayStride: (3 + 3 + 3 + 2) * 4, // position + normal + color + uv
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x3' },       // position
                            { shaderLocation: 1, offset: 3 * 4, format: 'float32x3' },   // normal
                            { shaderLocation: 2, offset: 6 * 4, format: 'float32x3' },   // color
                            { shaderLocation: 3, offset: 9 * 4, format: 'float32x2' },   // uv
                        ],
                    },
                ],
            },
            fragment: {
                module: gBufferShaderModule,
                entryPoint: "fs",
                targets: [
                    { format: "rgba16float" }, // position
                    { format: "rgba16float" },  // normal
                ]
            },
            depthStencil: {
                format: "depth24plus",
                depthWriteEnabled: true,
                depthCompare: "less"
            }
        });

        //gBufferDebug
        const gBufferDebugShaderModule = GPU.CreateShaderModule({ code: assets.shaders['gBufferDebug.wgsl'] });
        const gBufferDebugPipeline = this.gBufferDebugPipeline = GPU.CreateRenderPipeline({
            layout: "auto",
            vertex: { module: gBufferDebugShaderModule, entryPoint: "vs", buffers: [] },
            fragment: {
                module: gBufferDebugShaderModule,
                entryPoint: "fs_debug",
                targets: [
                    { format: format } // <- pasuje do canvas
                ]
            },
            primitive: { topology: "triangle-list" },
        });
        const gBufferDebugBindGroup = this.gBufferDebugBindGroup = GPU.CreateBindGroup({
            layout: this.gBufferDebugPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.gBufferTextures.position.createView() },
                { binding: 1, resource: this.gBufferTextures.normal.createView() },
                { binding: 2, resource: this.sampler },
            ],
        });

        //ssao
        const ssaoShaderModule = GPU.CreateShaderModule({ code: assets.shaders['ssao.wgsl'] });
        const ssaoPipeline = this.ssaoPipeline = GPU.CreateRenderPipeline({
            layout: "auto",
            vertex: {
                module: ssaoShaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: ssaoShaderModule,
                entryPoint: "fs",
                targets: [
                    { format: "rgba8unorm" }
                ]
            }
        });
        const ssaoBindGroup = this.ssaoBindGroup = GPU.CreateBindGroup({
            layout: this.ssaoPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.gBufferTextures.position.createView() },
                { binding: 1, resource: this.gBufferTextures.normal.createView() },
                { binding: 2, resource: this.sampler },
            ],
        });

        //ssaoDebug
        const ssaoDebugShaderModule = GPU.CreateShaderModule({ code: assets.shaders['ssaoDebug.wgsl'] });
        const ssaoDebugPipeline = this.ssaoDebugPipeline = GPU.CreateRenderPipeline({
            layout: "auto",
            vertex: { module: ssaoDebugShaderModule, entryPoint: "vs", buffers: [] },
            fragment: {
                module: ssaoDebugShaderModule,
                entryPoint: "fs_debug",
                targets: [{ format }] // używamy preferowanego formatu
            },
            primitive: { topology: "triangle-list" },
        });
        const ssaoDebugBindGroup = this.ssaoDebugBindGroup = GPU.CreateBindGroup({
            layout: this.ssaoDebugPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.ssaoTexture.createView() },
                { binding: 1, resource: this.sampler },
            ],
        });

        //Final
        const finalPipeline = this.finalPipeline = GPU.CreateRenderPipeline({
            layout: "auto",
            vertex: {
                module: finalShaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: finalShaderModule,
                entryPoint: "fs",
                targets: [{ format }]
            }
        });
        const finalBindGroup = this.finalBindGroup = GPU.CreateBindGroup({
            layout: this.finalPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.gBufferTextures.position.createView() },
                { binding: 1, resource: this.gBufferTextures.normal.createView() },
                { binding: 2, resource: this.gBufferTextures.color.createView() },
                { binding: 3, resource: this.ssaoTexture.createView() },
                { binding: 4, resource: this.sampler },
            ],
        });

        callback();
    }

    static Update() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    static Render(engine) {
        const canvas = this.canvas;
        const context = this.context;

        const commandEncoder = this.commandEncoder = GPU.CreateCommandEncoder();

        //New

        // 1.gBuffer
        const gBufferPass = this.gBufferPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.gBufferTextures.position.createView(), loadOp: "clear", storeOp: "store" },
                { view: this.gBufferTextures.normal.createView(), loadOp: "clear", storeOp: "store" },
            ],
            depthStencilAttachment: {
                view: this.gBufferTextures.depth.createView(),
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store"
            }
        });

        gBufferPass.setPipeline(this.gBufferPipeline);
        if (engine.scene) engine.scene.Render(gBufferPass, this.gBufferPipeline);
        gBufferPass.end();
        // 1.gBuffer

        // 2.SSAO
        const ssaoPass = commandEncoder.beginRenderPass({
            colorAttachments: [{ view: this.ssaoTexture.createView(), loadOp: "clear", storeOp: "store" }]
        });
        ssaoPass.setPipeline(this.ssaoPipeline);
        ssaoPass.setBindGroup(0, this.ssaoBindGroup); // bind group z posTex, normTex, sampler
        ssaoPass.draw(6);
        ssaoPass.end();
        // 2.SSAO

        // 3.Color
        const renderPass = this.renderPass = this.commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.gBufferTextures.color.createView(), loadOp: "clear", storeOp: "store" },
            ],
            depthStencilAttachment: {
                view: this.gBufferTextures.depth.createView(),
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store"
            },
        });
        if (engine.scene) engine.scene.Render(renderPass);
        renderPass.end();
        // 3.Color

        // 4.final
        const finalPass = commandEncoder.beginRenderPass({
            colorAttachments: [{ view: this.context.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store" }]
        });
        finalPass.setPipeline(this.finalPipeline);
        finalPass.setBindGroup(0, this.finalBindGroup); // bind group z posTex, normTex, sampler
        finalPass.draw(6);
        finalPass.end();
        // 4.final

        // 1.gBufferDebug
        // const gBufferDebugPass = commandEncoder.beginRenderPass({
        //     colorAttachments: [
        //         {
        //             view: this.context.getCurrentTexture().createView(), // wyświetlamy na ekranie
        //             loadOp: "clear",
        //             storeOp: "store"
        //         }
        //     ],
        // });
        // gBufferDebugPass.setPipeline(this.gBufferDebugPipeline);
        // gBufferDebugPass.setBindGroup(0, this.gBufferDebugBindGroup); // bind group z posTex, normTex, sampler
        // gBufferDebugPass.draw(6);
        // gBufferDebugPass.end();
        // 1.gBufferDebug

        // 2.ssaoDebug
        // const ssaoDebugPass = commandEncoder.beginRenderPass({
        //     colorAttachments: [
        //         {
        //             view: this.context.getCurrentTexture().createView(), // wyświetlamy na ekranie
        //             loadOp: "clear",
        //             storeOp: "store"
        //         }
        //     ],
        // });
        // ssaoDebugPass.setPipeline(this.ssaoDebugPipeline);
        // ssaoDebugPass.setBindGroup(0, this.ssaoDebugBindGroup); // bind group z posTex, normTex, sampler
        // ssaoDebugPass.draw(6);
        // ssaoDebugPass.end();
        // 2.ssaoDebug

        GPU.Queue.submit([commandEncoder.finish()]);
    }

    static GenerateKernel(size = 64) {
        const kernel = [];

        for (let i = 0; i < size; i++) {
            let sample = new Vector3(
                Math.random() * 2.0 - 1.0,
                Math.random() * 2.0 - 1.0,
                Math.random()
            );

            sample.Normalize(sample);
            sample.Multiply(Math.random());

            kernel.push(sample);
        }

        return kernel;
    }

}