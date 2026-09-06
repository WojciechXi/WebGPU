class Graphics {

    static {
        this.lightViewProjectionMatrix = Matrix4x4.Identity();
        this.lightDirection = Vector3.down;
        this.lightColor = Color.white;
        this.ambientLightColor = Color.zero;
    }

    static get Width() { return this.canvas.width; }
    static get Height() { return this.canvas.height; }

    static async Init(callback) {
        this.canvas = document.querySelector('#view');
        // this.canvas.addEventListener('click', event => this.canvas.requestPointerLock({ unadjustedMovement: true, }));
        this.canvas.focus();

        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        this.context = this.canvas.getContext('webgpu');

        this.context.configure({
            device: GPU.device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'premultiplied',
            presentMode: 'immediate',
        });

        this.viewBindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'ViewBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, }
            ],
        });

        this.lightBindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'LightBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, }
            ],
        });

        this.materialBindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'MaterialBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, }
            ],
        });

        this.pbrBindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'PBRBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: {}, },
                { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                { binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                { binding: 4, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
            ],
        });

        this.jointsBindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'JointBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, }
            ],
        });

        callback();
    }

    static Blit() { }
    static BlitMultiTap() { }
    static ClearRandomWriteTargets() { }
    static ConvertTexture() { }
    static CopyBuffer() { }
    static CopyTexture() { }
    static CreateAsyncGraphicsFence() { }
    static CreateGraphicsFence() { }
    static DrawMesh(mesh, matrix, material, layer, camera = null, subMeshIndex = 0, castShadows = true, receiveShadows = true) {

    }
    static DrawMeshInstanced() { }
    static DrawMeshInstancedIndirect() { }
    static DrawMeshInstancedProcedural() { }
    static DrawMeshNow() { }
    static DrawProcedural() { }
    static DrawProceduralIndirect() { }
    static DrawProceduralIndirectNow() { }
    static DrawProceduralNow() { }
    static DrawTexture() { }
    static ExecuteCommandBuffer(commandBuffer) { }
    static ExecuteCommandBufferAsync() { }
    static RenderMesh() { }
    static RenderMeshIndirect() { }
    static RenderMeshInstanced() { }
    static RenderMeshPrimitives() { }
    static RenderPrimitives() { }
    static RenderPrimitivesIndexed() { }
    static RenderPrimitivesIndexedIndirect() { }
    static RenderPrimitivesIndirect() { }
    static RenderSprite() { }
    static RenderSpriteInstanced() { }
    static SetRandomWriteTarget() { }
    static SetRenderTarget() { }
    static WaitOnAsyncGraphicsFence() { }

}