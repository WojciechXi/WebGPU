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
        this.canvas.focus();

        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        this.context = this.canvas.getContext('webgpu');
        this.context.configure({
            device: GPU.device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'premultiplied',
        });

        callback();
    }

    static Awake() {
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

        this.transformBindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'TransformBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, }
            ],
        });

        this.materialBindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'TransformBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, }
            ],
        });

        this.pbrBindGroupLayout = GPU.CreateBindGroupLayout({
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

        const sceneRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'rgba16float', });

        console.log(Resources.Get('/Resources/Shaders/shadowRenderPass.wgsl'));

        const shadowRenderPass = this.shadowRenderPass = new ShadowRenderPass({
            name: 'shadowRenderPass',
            code: Resources.Get('/Resources/Shaders/shadowRenderPass.wgsl'),
            canvas: this.canvas,
        });

        const gBufferRenderPass = this.gBufferRenderPass = new GBufferRenderPass({
            name: 'gBufferRenderPass',
            canvas: this.canvas,
        });

        const clearRenderPass = this.clearRenderPass = new ClearRenderPass({
            name: 'clearRenderPass',
            code: Resources.Get('/Resources/Shaders/clearRenderPass.wgsl'),
            canvas: this.canvas,
        });

        const lightingRenderPass = this.lightingRenderPass = new LightingRenderPass({
            name: 'lightingRenderPass',
            code: Resources.Get('/Resources/Shaders/lightingRenderPass.wgsl'),
            shadowRenderPass: shadowRenderPass,
            gBufferRenderPass: gBufferRenderPass,
            canvas: this.canvas,
        });

        const forwardRenderPass = this.forwardRenderPass = new ForwardRenderPass({
            name: 'forwardRenderPass',
            code: Resources.Get('/Resources/Shaders/forwardRenderPass.wgsl'),
            lightingRenderPass: lightingRenderPass,
            canvas: this.canvas,
        });

        const finalRenderPass = this.finalRenderPass = new FinalRenderPass({
            name: 'finalRenderPass',
            code: Resources.Get('/Resources/Shaders/finalRenderPass.wgsl'),
            clearRenderPass: clearRenderPass,
            gBufferRenderPass: gBufferRenderPass,
            lightingRenderPass: lightingRenderPass,
            forwardRenderPass: forwardRenderPass,
            sceneRenderTexture: sceneRenderTexture,
            canvas: this.canvas,
        });

        const ssaoRenderPass = this.ssaoRenderPass = new SSAORenderPass({
            name: 'ssaoRenderPass',
            code: Resources.Get('/Resources/Shaders/ssaoRenderPass.wgsl'),
            gBufferRenderPass: gBufferRenderPass,
            inputRenderTexture: sceneRenderTexture,
            canvas: this.canvas,
        });

        const screenSpaceReflectionRenderPass = this.screenSpaceReflectionRenderPass = new ScreenSpaceReflectionRenderPass({
            name: 'screenSpaceReflectionRenderPass',
            code: Resources.Get('/Resources/Shaders/screenSpaceReflectionRenderPass.wgsl'),
            gBufferRenderPass: gBufferRenderPass,
            inputRenderTexture: ssaoRenderPass.sceneRenderTexture,
            canvas: this.canvas,
        });

        const bloomRenderPass = this.bloomRenderPass = new BloomRenderPass({
            name: 'bloomRenderPass',
            code: Resources.Get('/Resources/Shaders/bloomRenderPass.wgsl'),
            inputRenderTexture: ssaoRenderPass.sceneRenderTexture,
            canvas: this.canvas,
        });

        const tonemappingRenderPass = this.tonemappingRenderPass = new TonemappingRenderPass({
            name: 'tonemappingRenderPass',
            code: Resources.Get('/Resources/Shaders/tonemappingRenderPass.wgsl'),
            inputRenderTexture: bloomRenderPass.sceneRenderTexture,
            canvas: this.canvas,
        });

        const screenRenderPass = this.screenRenderPass = new ScreenRenderPass({
            name: 'screenRenderPass',
            code: Resources.Get('/Resources/Shaders/screenRenderPass.wgsl'),
            canvas: this.canvas,
        });

        const gizmosRenderPass = this.gizmosRenderPass = new GizmosRenderPass({
            name: 'gizmosRenderPass',
            code: Resources.Get('/Resources/Shaders/gizmosRenderPass.wgsl'),
            canvas: this.canvas,
        });

        screenRenderPass.renderTexture = tonemappingRenderPass.sceneRenderTexture;
    }

    static Render(scene) {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        for (let component of scene.renderables) if (component.OnPreRender) component.OnPreRender();
        for (let component of scene.directionalLights) if (component.OnPreRender) component.OnPreRender();
        if (scene && scene.cameras.length) for (let camera of scene.cameras) this.RenderCamera(camera, scene);
        for (let component of scene.directionalLights) if (component.OnPostRender) component.OnPostRender();
        for (let component of scene.renderables) if (component.OnPostRender) component.OnPostRender();
    }

    static RenderCamera(camera, scene) {
        camera.OnPreCull();
        camera.OnPreRender();

        const commandEncoder = this.commandEncoder = GPU.CreateCommandEncoder();

        if (this.shadowRenderPass) this.shadowRenderPass.Render(camera, scene, commandEncoder);
        if (this.gBufferRenderPass) this.gBufferRenderPass.Render(camera, scene, commandEncoder);

        if (this.clearRenderPass) this.clearRenderPass.Render(camera, scene, commandEncoder);

        if (this.lightingRenderPass) this.lightingRenderPass.Render(camera, scene, commandEncoder);
        if (this.forwardRenderPass) this.forwardRenderPass.Render(camera, scene, commandEncoder);
        if (this.finalRenderPass) this.finalRenderPass.Render(camera, scene, commandEncoder);

        if (this.ssaoRenderPass) this.ssaoRenderPass.Render(camera, scene, commandEncoder);
        // if (this.screenSpaceReflectionRenderPass) this.screenSpaceReflectionRenderPass.Render(camera, scene, commandEncoder);
        if (this.bloomRenderPass) this.bloomRenderPass.Render(camera, scene, commandEncoder);
        if (this.tonemappingRenderPass) this.tonemappingRenderPass.Render(camera, scene, commandEncoder);

        if (this.screenRenderPass) this.screenRenderPass.Render(camera, scene, commandEncoder);

        // if (this.gizmosRenderPass) this.gizmosRenderPass.Render(camera, scene, commandEncoder);

        GPU.Queue.submit([commandEncoder.finish()]);

        camera.OnPostRender();
    }

}