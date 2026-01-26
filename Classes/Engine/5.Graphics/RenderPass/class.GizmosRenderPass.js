class GizmosRenderPass extends RenderPass {

    Init(data) {
        this.canvas = data.canvas;

        this.buffers = [];
        this.bufferIndex = 0;
        for (let i = 0; i < 128; i++) this.buffers[i] = new Buffer(16, { usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST }); //matrix4x4

        this.depthRenderTarget = new RenderTexture(this.canvas.width, this.canvas.height, {
            format: 'depth24plus',
        });

        this.renderPipeline = GPU.CreateRenderPipeline({
            label: 'gimosRenderPipeline',
            layout: GPU.CreatePipelineLayout({
                bindGroupLayouts: [
                    Graphics.viewBindGroupLayout,
                ],
            }),
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs",
                buffers: [
                    {
                        arrayStride: (4 + 4 + 4 + 4 + 4) * 4, // position
                        attributes: [
                            { shaderLocation: 0, offset: 0 * 4, format: 'float32x3' }, // position
                        ],
                    },
                    {
                        arrayStride: (16) * 4, // matrix4x4
                        stepMode: 'instance',
                        attributes: [
                            { shaderLocation: 5, offset: 0 * 4, format: 'float32x4' },
                            { shaderLocation: 6, offset: 4 * 4, format: 'float32x4' },
                            { shaderLocation: 7, offset: 8 * 4, format: 'float32x4' },
                            { shaderLocation: 8, offset: 12 * 4, format: 'float32x4' },
                        ],
                    },
                ],
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "fs",
                targets: [
                    { format: 'bgra8unorm', }
                ],
            },
            primitive: { topology: 'line-list' },
            depthStencil: {
                format: this.depthRenderTarget.format, depthWriteEnabled: false, depthCompare: 'always'
            },
        });
    }

    Render(cameras, scene, commandEncoder) {
        const renderPass = this.renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: Graphics.context.getCurrentTexture().createView(),
                    loadOp: "load",
                    storeOp: "store",
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                },
            ],
            depthStencilAttachment: this.depthRenderTarget.GetDepthStencilAttachment(),
        });

        renderPass.setPipeline(this.renderPipeline);
        for (let camera of cameras) {
            if (!camera.drawGizmos) continue;

            renderPass.setBindGroup(0, camera.cameraBindGroup);
            renderPass.setViewport(this.canvas.width * camera.rect.x, this.canvas.height * camera.rect.y, this.canvas.width * camera.rect.width, this.canvas.height * camera.rect.height, 0, 1);
            renderPass.setScissorRect(this.canvas.width * camera.rect.x, this.canvas.height * camera.rect.y, this.canvas.width * camera.rect.width, this.canvas.height * camera.rect.height);

            this.bufferIndex = 0;
            for (let component of scene.gizmos) {
                component.OnDrawGizmos(this, camera);
            }
        }
        renderPass.end();
    }

    DrawMesh(mesh, subMeshIndex, matrix4x4) {
        this.buffers[this.bufferIndex].Set(matrix4x4);
        const buffer = this.buffers[this.bufferIndex];
        this.bufferIndex++;

        const subMesh = mesh.subMeshes[subMeshIndex];

        this.SetVertexBuffer(0, mesh.vertexBuffer.buffer);
        this.SetVertexBuffer(1, buffer.buffer);
        this.SetIndexBuffer(subMesh.edgeBuffer.buffer, 'uint32');
        this.DrawIndexed(subMesh.edges.length);

    }

}