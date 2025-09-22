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
        const context = this.context = canvas.getContext('webgpu');
        const currentTexture = this.currentTexture = null;
        const depthTexture = this.depthTexture = null;

        const format = navigator.gpu.getPreferredCanvasFormat();
        context.configure({ device, format });

        this.colorAttachment = {
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
        };

        this.depthStencilAttachment = {
            depthLoadOp: 'clear',
            depthClearValue: 1.0,
            depthStoreOp: 'store',
        };

        this.renderPassDescriptor = {
            label: 'our basic canvas renderPass',
            colorAttachments: [
                this.colorAttachment,
            ],
            depthStencilAttachment: this.depthStencilAttachment,
        };

        this.ssaoKernel = this.GenerateKernel(32);

        const gBufferTextures = this.gBufferTextures = {
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

        const gbufferModule = GPU.CreateShaderModule({ code: assets.shaders['gBuffer.wgsl'] });
        const ssaoModule = GPU.CreateShaderModule({ code: assets.shaders['SSAO.wgsl'] });
        const finalModule = GPU.CreateShaderModule({ code: assets.shaders['Final.wgsl'] });

        const gBufferPipeline = this.gBufferPipeline = GPU.CreateRenderPipeline({
            layout: "auto",
            vertex: {
                module: gbufferModule,
                entryPoint: "vs"
            },
            fragment: {
                module: gbufferModule,
                entryPoint: "fs",
                targets: [
                    { format: "rgba16float" }, // position
                    { format: "rgba16float" }  // normal
                ]
            },
            depthStencil: {
                format: "depth24plus",
                depthWriteEnabled: true,
                depthCompare: "less"
            }
        });

        const ssaoPipeline = this.ssaoPipeline = GPU.CreateRenderPipeline({
            layout: "auto",
            vertex: {
                module: ssaoModule,
                entryPoint: "vs"
            },
            fragment: {
                module: ssaoModule,
                entryPoint: "fs",
                targets: [{ format: "rgba8unorm" }]
            }
        });

        const finalPipeline = this.finalPipeline = GPU.CreateRenderPipeline({
            layout: "auto",
            vertex: {
                module: finalModule,
                entryPoint: "vs"
            },
            fragment: {
                module: finalModule,
                entryPoint: "fs",
                targets: [{ format }]
            }
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

        this.currentTexture = this.context.getCurrentTexture();
        if (!this.depthTexture || this.depthTexture.width !== this.currentTexture.width || this.depthTexture.height !== this.currentTexture.height) {
            if (this.depthTexture) this.depthTexture.destroy();
            this.depthTexture = GPU.CreateTexture({
                size: [this.currentTexture.width, this.currentTexture.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
        }

        this.colorAttachment.view = this.currentTexture.createView();
        this.depthStencilAttachment.view = this.depthTexture.createView();

        const commandEncoder = this.commandEncoder = GPU.CreateCommandEncoder();

        //Old
        // const renderPass = this.renderPass = this.commandEncoder.beginRenderPass(this.renderPassDescriptor);
        // if (engine.scene) engine.scene.Render();
        // renderPass.end();

        //New

        // 1.gBuffer
        const gBufferPass = this.gBufferPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.gBufferTextures.position.createView(), loadOp: "clear", storeOp: "store" },
                { view: this.gBufferTextures.normal.createView(), loadOp: "clear", storeOp: "store" }
            ],
            depthStencilAttachment: {
                view: this.gBufferTextures.depth.createView(),
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store"
            }
        });

        gBufferPass.setPipeline(this.gBufferPipeline);
        if (engine.scene) engine.scene.Render(gBufferPass);
        gBufferPass.end();
        // 1.gBuffer

        //2.SSAO
        const aoTex = GPU.CreateTexture({
            size: [canvas.width, canvas.height],
            format: "rgba8unorm",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        const aoPass = commandEncoder.beginRenderPass({
            colorAttachments: [{ view: aoTex.createView(), loadOp: "clear", storeOp: "store" }]
        });
        aoPass.setPipeline(this.ssaoPipeline);
        // fullscreen quad
        aoPass.draw(6);
        aoPass.end();
        //2.SSAO

        //2.final
        const finalPass = commandEncoder.beginRenderPass({
            colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store" }]
        });
        finalPass.setPipeline(this.finalPipeline);
        // fullscreen quad, bind gbuffer + ao
        finalPass.draw(6);
        finalPass.end();
        //2.final

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