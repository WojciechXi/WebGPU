class ShadowRenderPass extends RenderPass {

    Init(data) {
        this.resolution = data.resolution ?? 2048;
        this.canvas = data.canvas;

        this.depthRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'depth24plus', });

        this.renderPipeline = GPU.CreateRenderPipeline({
            layout: GPU.CreatePipelineLayout({
                bindGroupLayouts: [
                    Graphics.viewBindGroupLayout,
                    Graphics.jointsBindGroupLayout,
                ],
            }),
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs",
                buffers: [
                    {
                        arrayStride: (4 + 4 + 4 + 4 + 4 + 4 + 4) * 4, // position + normal + tangent + color + uv + joints + weights
                        attributes: [
                            { shaderLocation: 0, offset: 0 * 4, format: 'float32x3' }, // position
                            { shaderLocation: 1, offset: 4 * 4, format: 'float32x3' }, // normal
                            { shaderLocation: 2, offset: 8 * 4, format: 'float32x4' }, // tangent
                            { shaderLocation: 3, offset: 12 * 4, format: 'float32x4' }, // color
                            { shaderLocation: 4, offset: 16 * 4, format: 'float32x2' }, // uv
                            { shaderLocation: 5, offset: 20 * 4, format: 'float32x4' }, // joints
                            { shaderLocation: 6, offset: 24 * 4, format: 'float32x4' }, // weights
                        ],
                    },
                    {
                        arrayStride: (16) * 4, // matrix4x4
                        stepMode: 'instance',
                        attributes: [
                            { shaderLocation: 7, offset: 0 * 4, format: 'float32x4' },
                            { shaderLocation: 8, offset: 4 * 4, format: 'float32x4' },
                            { shaderLocation: 9, offset: 8 * 4, format: 'float32x4' },
                            { shaderLocation: 10, offset: 12 * 4, format: 'float32x4' },
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

    Render(cameras, scene, commandEncoder) {
        if (!scene.directionalLight || !scene.directionalLight.lightBindGroup) return;

        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [],
            depthStencilAttachment: this.depthRenderTexture.GetDepthStencilAttachment(),
        });
        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, scene.directionalLight.lightBindGroup);
        for (let component of scene.renderables) component.OnDraw(this);
        renderPass.end();
    }

    DrawMesh(mesh, subMeshIndex, matrixBuffer) {
        const subMesh = mesh.GetSubMesh(subMeshIndex);

        this.SetVertexBuffer(0, mesh.vertexBuffer.buffer);
        this.SetVertexBuffer(1, matrixBuffer);
        this.SetBindGroup(1, this.emptyBindGroup);
        this.SetIndexBuffer(subMesh.triangleBuffer.buffer, 'uint32');
        this.DrawIndexed(subMesh.triangleBuffer.count);
    }

    DrawSkinnedMesh(mesh, subMeshIndex, matrixBuffer, jointsBindGroup) {
        const subMesh = mesh.GetSubMesh(subMeshIndex);

        this.SetVertexBuffer(0, mesh.vertexBuffer.buffer);
        this.SetVertexBuffer(1, matrixBuffer);
        this.SetBindGroup(1, jointsBindGroup);

        this.SetIndexBuffer(subMesh.triangleBuffer.buffer, 'uint32');
        this.DrawIndexed(subMesh.triangleBuffer.count);
    }

}