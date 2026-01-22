class Graphics {

    static {
        this.lightViewProjectionMatrix = Matrix4x4.Identity();
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

        this.viewBindGroupLayout = GPU.device.createBindGroupLayout({
            label: 'ViewBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, }
            ],
        });

        this.transformBindGroupLayout = GPU.device.createBindGroupLayout({
            label: 'TransformBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, }
            ],
        });

        this.materialBindGroupLayout = GPU.device.createBindGroupLayout({
            label: 'TransformBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, }
            ],
        });

        this.pbrBindGroupLayout = GPU.device.createBindGroupLayout({
            label: 'ViewBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: {}, },
                { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                { binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                { binding: 4, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                { binding: 5, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
            ],
        });

        const context = this.context = canvas.getContext('webgpu');

        context.configure({
            device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'premultiplied',
        });

        const sceneTexture = this.sceneTexture = GPU.CreateTexture({
            size: [this.canvas.width, this.canvas.height],
            format: 'rgba16float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.sceneTextureView = this.sceneTexture.createView();

        const clearRenderPass = this.clearRenderPass = new ClearRenderPass({
            name: 'clearRenderPass',
            code: assets.shaders['clearRenderPass.wgsl'],
            canvas: canvas,
        });

        const shadowRenderPass = this.shadowRenderPass = new ShadowRenderPass({
            name: 'shadowRenderPass',
            canvas: canvas,
        });

        const gBufferRenderPass = this.gBufferRenderPass = new GBufferRenderPass({
            name: 'gBufferRenderPass',
            code: assets.shaders['gBufferRenderPass.wgsl'],
            canvas: canvas,
        });

        const lightingRenderPass = this.lightingRenderPass = new LightingRenderPass({
            name: 'lightingRenderPass',
            code: assets.shaders['lightingRenderPass.wgsl'],
            shadowRenderPass: shadowRenderPass,
            gBufferRenderPass: gBufferRenderPass,
            canvas: canvas,
        });

        const forwardRenderPass = this.forwardRenderPass = new ForwardRenderPass({
            name: 'forwardRenderPass',
            code: assets.shaders['forwardRenderPass.wgsl'],
            lightingRenderPass: lightingRenderPass,
            canvas: canvas,
        });

        const finalRenderPass = this.finalRenderPass = new FinalRenderPass({
            name: 'finalRenderPass',
            code: assets.shaders['finalRenderPass.wgsl'],
            clearRenderPass: clearRenderPass,
            gBufferRenderPass: gBufferRenderPass,
            lightingRenderPass: lightingRenderPass,
            forwardRenderPass: forwardRenderPass,
            sceneTextureView: this.sceneTextureView,
            canvas: canvas,
        });

        const ssaoRenderPass = this.ssaoRenderPass = new SSAORenderPass({
            name: 'ssaoRenderPass',
            code: assets.shaders['ssaoRenderPass.wgsl'],
            gBufferRenderPass: gBufferRenderPass,
            inputTextureView: this.sceneTextureView,
            canvas: canvas,
        });

        const screenSpaceReflectionRenderPass = this.screenSpaceReflectionRenderPass = new ScreenSpaceReflectionRenderPass({
            name: 'screenSpaceReflectionRenderPass',
            code: assets.shaders['screenSpaceReflectionRenderPass.wgsl'],
            gBufferRenderPass: gBufferRenderPass,
            inputTextureView: ssaoRenderPass.sceneTextureView,
            canvas: canvas,
        });

        const bloomRenderPass = this.bloomRenderPass = new BloomRenderPass({
            name: 'bloomRenderPass',
            code: assets.shaders['bloomRenderPass.wgsl'],
            inputTextureView: ssaoRenderPass.sceneTextureView,
            canvas: canvas,
        });

        const tonemappingRenderPass = this.tonemappingRenderPass = new TonemappingRenderPass({
            name: 'tonemappingRenderPass',
            code: assets.shaders['tonemappingRenderPass.wgsl'],
            inputTextureView: bloomRenderPass.sceneTextureView,
            canvas: canvas,
        });

        const debugRenderPass = this.debugRenderPass = new DebugRenderPass({
            name: 'debugRenderPass',
            code: assets.shaders['debugRenderPass.wgsl'],
            canvas: canvas,
        });

        const gizmosRenderPass = this.gizmosRenderPass = new GizmosRenderPass({
            name: 'gizmosRenderPass',
            code: assets.shaders['gizmosRenderPass.wgsl'],
            canvas: canvas,
        });

        debugRenderPass.textureView = tonemappingRenderPass.sceneTextureView;

        callback();
    }

    static Render(scene) {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        for (let component of scene.renderables) if (component.OnPreRender) component.OnPreRender();
        if (scene && scene.cameras.length) for (let camera of scene.cameras) this.RenderCamera(camera, scene);
        for (let component of scene.renderables) if (component.OnPostRender) component.OnPostRender();
    }

    static RenderCamera(camera, scene) {
        camera.OnPreCull();
        camera.OnPreRender();

        const commandEncoder = this.commandEncoder = GPU.CreateCommandEncoder();

        if (this.clearRenderPass) this.clearRenderPass.Render(camera, scene, commandEncoder);
        // if (this.shadowRenderPass) this.shadowRenderPass.Render(DirectionalLight.main, scene, commandEncoder);

        if (this.gBufferRenderPass) this.gBufferRenderPass.Render(camera, scene, commandEncoder);
        if (this.lightingRenderPass) this.lightingRenderPass.Render(camera, scene, commandEncoder);
        if (this.forwardRenderPass) this.forwardRenderPass.Render(camera, scene, commandEncoder);
        if (this.finalRenderPass) this.finalRenderPass.Render(camera, scene, commandEncoder);

        if (this.ssaoRenderPass) this.ssaoRenderPass.Render(camera, scene, commandEncoder);
        if (this.screenSpaceReflectionRenderPass) this.screenSpaceReflectionRenderPass.Render(camera, scene, commandEncoder);
        if (this.bloomRenderPass) this.bloomRenderPass.Render(camera, scene, commandEncoder);
        if (this.tonemappingRenderPass) this.tonemappingRenderPass.Render(camera, scene, commandEncoder);

        if (this.debugRenderPass) this.debugRenderPass.Render(camera, scene, commandEncoder);

        // if (this.gizmosRenderPass) this.gizmosRenderPass.Render(camera, scene, commandEncoder);

        GPU.Queue.submit([commandEncoder.finish()]);

        camera.OnPostRender();
    }

}