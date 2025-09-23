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

        const gBufferRenderPass = this.gBufferRenderPass = new GBufferRenderPass(assets.shaders['renderPassGBuffer.wgsl'], canvas);
        const ssaoRenderPass = this.ssaoRenderPass = new SSAORenderPass(assets.shaders['renderPassSSAO.wgsl'], canvas);
        const finalRenderPass = this.finalRenderPass = new SSAORenderPass(assets.shaders['renderPassFinal.wgsl'], canvas);

        const finalShaderModule = GPU.CreateShaderModule({ code: assets.shaders['renderPassFinal.wgsl'] });

        //sampler
        const sampler = this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        const depthTexture = this.depthTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        const ssaoTexture = this.ssaoTexture = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba8unorm",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        /*
        //ssao
        const ssaoKernel = this.ssaoKernel = this.GenerateKernel(32);
        const ssaoShaderModule = GPU.CreateShaderModule({ code: assets.shaders['renderPassSSAO.wgsl'] });
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
        const ssaoUniformValues = this.ssaoUniformValues = new Float32Array(16 + ssaoKernel.length);
        const ssaoUniformBuffer = this.ssaoUniformBuffer = device.createBuffer({
            size: ssaoUniformValues.length * 4, // mat4x4<f32> = 16 * 4 bajty
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.ssaoUniformValues.set(ssaoKernel, 16);
        const ssaoBindGroup = this.ssaoBindGroup = GPU.CreateBindGroup({
            layout: this.ssaoPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.gBufferTextures.positionView.createView() },
                { binding: 1, resource: this.gBufferTextures.normalView.createView() },
                { binding: 2, resource: this.sampler },
                { binding: 3, resource: { buffer: ssaoUniformBuffer } },
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
                { binding: 0, resource: this.gBufferTextures.normal.createView() },
                { binding: 1, resource: this.gBufferTextures.color.createView() },
                { binding: 2, resource: this.ssaoTexture.createView() },
                { binding: 3, resource: this.sampler },
            ],
        });
        */

        //debug
        const debugShaderModule = GPU.CreateShaderModule({ code: assets.shaders['debugRenderPass.wgsl'] });
        const debugPipeline = this.debugPipeline = GPU.CreateRenderPipeline({
            layout: "auto",
            vertex: { module: debugShaderModule, entryPoint: "vs", buffers: [] },
            fragment: {
                module: debugShaderModule,
                entryPoint: "fs_debug",
                targets: [{ format }] // używamy preferowanego formatu
            },
            primitive: { topology: "triangle-list" },
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

        this.gBufferRenderPass.Render(engine, commandEncoder);

        // 2.SSAO
        // const ssaoPass = commandEncoder.beginRenderPass({
        //     colorAttachments: [{ view: this.ssaoTexture.createView(), loadOp: "clear", storeOp: "store" }]
        // });
        // ssaoPass.setPipeline(this.ssaoPipeline);
        // ssaoPass.setBindGroup(0, this.ssaoBindGroup);
        // this.ssaoUniformValues.set(Camera.main.viewProjectionInverseMatrix, 0);
        // GPU.Queue.writeBuffer(this.ssaoUniformBuffer, 0, this.ssaoUniformValues);
        // ssaoPass.draw(6);
        // ssaoPass.end();
        // 2.SSAO

        // 3.Color
        // const renderPass = this.renderPass = this.commandEncoder.beginRenderPass({
        //     colorAttachments: [
        //         { view: this.gBufferTextures.color.createView(), loadOp: "clear", storeOp: "store" },
        //     ],
        //     depthStencilAttachment: {
        //         view: this.depthTexture.createView(),
        //         depthClearValue: 1.0,
        //         depthLoadOp: "clear",
        //         depthStoreOp: "store"
        //     },
        // });
        // if (engine.scene) engine.scene.Render(renderPass);
        // renderPass.end();
        // 3.Color

        // 4.final
        // const finalPass = commandEncoder.beginRenderPass({
        //     colorAttachments: [{ view: this.context.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store" }]
        // });
        // finalPass.setPipeline(this.finalPipeline);
        // finalPass.setBindGroup(0, this.finalBindGroup); // bind group z posTex, normTex, sampler
        // finalPass.draw(6);
        // finalPass.end();
        // 4.final

        // debug
        const debugPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(), // wyświetlamy na ekranie
                    loadOp: "clear",
                    storeOp: "store"
                }
            ],
        });
        debugPass.setPipeline(this.debugPipeline);
        debugPass.setBindGroup(0, GPU.CreateBindGroup({
            layout: this.debugPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.gBufferRenderPass.positionTexture.createView() },
                { binding: 1, resource: this.sampler },
            ],
        }));
        debugPass.draw(6);
        debugPass.end();
        // debug

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

            kernel.push(sample[0], sample[1], sample[2], 0);
        }

        return kernel;
    }

}