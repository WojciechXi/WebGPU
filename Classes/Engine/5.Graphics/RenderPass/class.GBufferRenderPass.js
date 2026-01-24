class GBufferRenderPass extends RenderPass {

    Init(data) {
        this.canvas = data.canvas;

        this.positionTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.positionTextureView = this.positionTexture.createView();

        this.normalTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "rgba8unorm",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.normalTextureView = this.normalTexture.createView();

        this.colorTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.colorTextureView = this.colorTexture.createView();

        this.emissionTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "rgba16float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.emissionTextureView = this.emissionTexture.createView();

        this.pbrTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "rgba8unorm",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.pbrTextureView = this.pbrTexture.createView();

        this.depthTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "r32float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.depthTextureView = this.depthTexture.createView();

        this.depthStencilTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        this.depthStencilTextureView = this.depthStencilTexture.createView();

        // this.renderPipeline = GPU.CreateRenderPipeline({
        //     layout: GPU.device.createPipelineLayout({
        //         bindGroupLayouts: [
        //             Graphics.viewBindGroupLayout,
        //             Graphics.transformBindGroupLayout,
        //             Graphics.materialBindGroupLayout,
        //             Graphics.pbrBindGroupLayout,
        //         ],
        //     }),
        //     vertex: {
        //         module: this.shaderModule,
        //         entryPoint: "vs",
        //         buffers: [
        //             {
        //                 arrayStride: (4 + 4 + 4 + 4 + 4) * 4, // position + normal + tangent + color + uv
        //                 attributes: [
        //                     { shaderLocation: 0, offset: 0 * 4, format: 'float32x3' }, // position
        //                     { shaderLocation: 1, offset: 4 * 4, format: 'float32x3' }, // normal
        //                     { shaderLocation: 2, offset: 8 * 4, format: 'float32x4' }, // tangent
        //                     { shaderLocation: 3, offset: 12 * 4, format: 'float32x4' }, // color
        //                     { shaderLocation: 4, offset: 16 * 4, format: 'float32x2' }, // uv
        //                 ],
        //             },
        //         ],
        //     },
        //     fragment: {
        //         module: this.shaderModule,
        //         entryPoint: "fs",
        //         targets: [],
        //     },
        //     primitive: {
        //         topology: "triangle-list",
        //         cullMode: 'back',
        //         frontFace: 'ccw',
        //     },
        //     depthStencil: {
        //         format: 'depth32float',
        //         depthWriteEnabled: true,
        //         depthCompare: 'less'
        //     },
        // });
    }

    Render(camera, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                { view: this.positionTextureView, loadOp: "clear", storeOp: "store" },
                { view: this.normalTextureView, loadOp: "clear", storeOp: "store" },

                { view: this.colorTextureView, loadOp: "clear", storeOp: "store" },
                { view: this.pbrTextureView, loadOp: "clear", storeOp: "store" },

                { view: this.depthTextureView, loadOp: "clear", storeOp: "store", }
            ],
            depthStencilAttachment: {
                view: this.depthStencilTextureView,
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store"
            },
        });

        for (let component of camera.renderables) component.Draw(this, camera);

        renderPass.end();
    }

}