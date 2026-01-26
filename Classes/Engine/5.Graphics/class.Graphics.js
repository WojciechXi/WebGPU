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

        this.shadowRenderPass = new ShadowRenderPass({
            name: 'shadowRenderPass',
            code: Resources.Get('/Resources/Shaders/shadowRenderPass.wgsl'),
            canvas: this.canvas,
        });

        this.gBufferRenderPass = new GBufferRenderPass({
            name: 'gBufferRenderPass',
            canvas: this.canvas,
        });

        this.lightingRenderPass = new LightingRenderPass({
            name: 'lightingRenderPass',
            code: Resources.Get('/Resources/Shaders/lightingRenderPass.wgsl'),
            shadowRenderPass: this.shadowRenderPass,
            gBufferRenderPass: this.gBufferRenderPass,
            canvas: this.canvas,
        });

        // this.ssaoRenderPass = new SSAORenderPass({
        //     name: 'ssaoRenderPass',
        //     code: Resources.Get('/Resources/Shaders/ssaoRenderPass.wgsl'),
        //     gBufferRenderPass: this.gBufferRenderPass,
        //     inputRenderTexture: this.lightingRenderPass.sceneRenderTexture,
        //     canvas: this.canvas,
        // });

        this.bloomRenderPass = new BloomRenderPass({
            name: 'bloomRenderPass',
            code: Resources.Get('/Resources/Shaders/bloomRenderPass.wgsl'),
            inputRenderTexture: this.lightingRenderPass.sceneRenderTexture,
            canvas: this.canvas,
        });

        this.tonemappingRenderPass = new TonemappingRenderPass({
            name: 'tonemappingRenderPass',
            code: Resources.Get('/Resources/Shaders/tonemappingRenderPass.wgsl'),
            inputRenderTexture: this.bloomRenderPass.sceneRenderTexture,
            canvas: this.canvas,
        });

        this.screenRenderPass = new ScreenRenderPass({
            name: 'screenRenderPass',
            code: Resources.Get('/Resources/Shaders/screenRenderPass.wgsl'),
            canvas: this.canvas,
        });

        this.screenRenderPass.renderTexture = this.tonemappingRenderPass.sceneRenderTexture;

        this.gizmosRenderPass = new GizmosRenderPass({
            name: 'gizmosRenderPass',
            code: Resources.Get('/Resources/Shaders/gizmosRenderPass.wgsl'),
            canvas: this.canvas,
        });
    }

    static set Preview(value) {
        switch (value) {
            case 1:
                this.screenRenderPass.renderTexture = this.tonemappingRenderPass.sceneRenderTexture;
                return;
            case 2:
                this.screenRenderPass.renderTexture = this.bloomRenderPass.bloomRenderTexture;
                return;
            case 3:
                this.screenRenderPass.renderTexture = this.lightingRenderPass.sceneRenderTexture;
                return;
            case 4:
                this.screenRenderPass.renderTexture = this.gBufferRenderPass.positionRenderTexture;
                return;
            case 5:
                this.screenRenderPass.renderTexture = this.gBufferRenderPass.normalRenderTexture;
                return;
            case 6:
                this.screenRenderPass.renderTexture = this.gBufferRenderPass.colorRenderTexture;
                return;
            case 7:
                this.screenRenderPass.renderTexture = this.gBufferRenderPass.depthRenderTexture;
                return;
            case 8:
                this.screenRenderPass.renderTexture = this.shadowRenderPass.depthRenderTexture;
                return;
        }
    }

    static Render(scene) {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        const commandEncoder = this.commandEncoder = GPU.CreateCommandEncoder();

        for (let component of scene.renderables) if (component.OnPreRender) component.OnPreRender();
        for (let component of scene.directionalLights) if (component.OnPreRender) component.OnPreRender();

        for (let component of scene.cameras) if (component.OnPreCull) component.OnPreCull();
        for (let component of scene.cameras) if (component.OnPreRender) component.OnPreRender();

        if (this.shadowRenderPass) this.shadowRenderPass.Render(scene.cameras, scene, commandEncoder);
        this.RenderCameras(scene.cameras, scene, commandEncoder);

        for (let component of scene.cameras) if (component.OnPostRender) component.OnPostRender();
        for (let component of scene.directionalLights) if (component.OnPostRender) component.OnPostRender();
        for (let component of scene.renderables) if (component.OnPostRender) component.OnPostRender();

        GPU.Queue.submit([commandEncoder.finish()]);
    }

    static RenderCameras(cameras, scene, commandEncoder) {
        if (this.gBufferRenderPass) this.gBufferRenderPass.Render(cameras, scene, commandEncoder);

        if (this.lightingRenderPass) this.lightingRenderPass.Render(cameras, scene, commandEncoder);
        if (this.forwardRenderPass) this.forwardRenderPass.Render(cameras, scene, commandEncoder);
        if (this.finalRenderPass) this.finalRenderPass.Render(cameras, scene, commandEncoder);

        if (this.ssaoRenderPass) this.ssaoRenderPass.Render(cameras, scene, commandEncoder);
        if (this.screenSpaceReflectionRenderPass) this.screenSpaceReflectionRenderPass.Render(cameras, scene, commandEncoder);
        if (this.bloomRenderPass) this.bloomRenderPass.Render(cameras, scene, commandEncoder);
        if (this.tonemappingRenderPass) this.tonemappingRenderPass.Render(cameras, scene, commandEncoder);

        if (this.screenRenderPass) this.screenRenderPass.Render(cameras, scene, commandEncoder);
        if (this.gizmosRenderPass) this.gizmosRenderPass.Render(cameras, scene, commandEncoder);
    }

}