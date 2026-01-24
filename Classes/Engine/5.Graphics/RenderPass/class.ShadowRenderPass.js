class ShadowRenderPass extends RenderPass {

    Init(data) {
        this.resolution = data.resolution ?? 2048;
        this.canvas = data.canvas;

        this.depthRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'depth24plus', });

        this.renderPipeline = GPU.CreateRenderPipeline({
            layout: GPU.device.createPipelineLayout({
                bindGroupLayouts: [
                    Graphics.viewBindGroupLayout,
                    Graphics.transformBindGroupLayout,
                ],
            }),
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs",
                buffers: [
                    {
                        arrayStride: (4 + 4 + 4 + 4 + 4) * 4, // position + normal + tangent + color + uv
                        attributes: [
                            { shaderLocation: 0, offset: 0 * 4, format: 'float32x3' }, // position
                            { shaderLocation: 1, offset: 4 * 4, format: 'float32x3' }, // normal
                            { shaderLocation: 2, offset: 8 * 4, format: 'float32x4' }, // tangent
                            { shaderLocation: 3, offset: 12 * 4, format: 'float32x4' }, // color
                            { shaderLocation: 4, offset: 16 * 4, format: 'float32x2' }, // uv
                        ],
                    },
                ],
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "fs",
                targets: [],
            },
            primitive: {
                topology: "triangle-list",
                cullMode: 'back',
                frontFace: 'ccw',
            },
            depthStencil: {
                format: this.depthRenderTexture.format,
                depthWriteEnabled: true,
                depthCompare: 'less'
            },
        });
    }

    Render(camera, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [],
            depthStencilAttachment: this.depthRenderTexture.GetDepthStencilAttachment(),
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, scene.directionalLight.lightBindGroup);

        for (let component of Engine.Instance.scene.renderables) component.OnDraw(this);

        renderPass.end();
    }

}