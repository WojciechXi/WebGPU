class SSAORenderPass extends RenderPass {

    Init(data) {
        const canvas = this.canvas = data.canvas;
        this.gBufferRenderPass = data.gBufferRenderPass;
        this.inputRenderTexture = data.inputRenderTexture;

        this.radius = data.radius ?? 0.5;
        this.bias = data.bias ?? 0.025;
        this.strength = data.strength ?? 1;
        this.blurRadius = data.blurRadius ?? 4;
        this.sigmaDepth = data.sigmaDepth ?? 0.3;

        this.ssaoRenderTexture = new RenderTexture(canvas.width / 2, canvas.height / 2, { format: 'r16float', });
        this.blurHorizontalRenderTexture = new RenderTexture(canvas.width / 2, canvas.height / 2, { format: 'r16float', });
        this.blurVerticalRenderTexture = new RenderTexture(canvas.width / 2, canvas.height / 2, { format: 'r16float', });
        this.sceneRenderTexture = new RenderTexture(canvas.width, canvas.height, { format: 'rgba16float', });

        const noise = new Float32Array(16 * 4);
        for (let i = 0; i < 16; i++) {
            noise[i * 4 + 0] = Mathf.Random();
            noise[i * 4 + 1] = Mathf.Random();
            noise[i * 4 + 2] = 0;
            noise[i * 4 + 3] = 0;
        }
        this.noiseTexture = GPU.CreateTexture({
            size: [4, 4, 1],
            format: "r16float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        this.noiseTextureView = this.noiseTexture.createView();
        GPU.Queue.writeTexture({ texture: this.noiseTexture }, noise, { bytesPerRow: 4 * 16 }, [4, 4, 1]);

        this.ssaoKernel = this.GenerateKernel(64);

        this.uniformValues = new Float32Array(this.ssaoKernel.length + 16 + 16 + 4 + 4);
        this.uniformValues.set(this.ssaoKernel, 0);
        this.uniformValues.set([this.canvas.width, this.canvas.height, this.radius, this.bias, this.blurRadius, this.sigmaDepth, this.strength], this.ssaoKernel.length + 32);

        this.uniformBuffer = GPU.CreateBuffer({
            size: this.uniformValues.length * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.sampler = GPU.CreateSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        this.noiseSampler = GPU.CreateSampler({
            magFilter: 'linear',
            minFilter: 'linear',
        });

        this.ssaoRenderPipeline = GPU.CreateRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "ssaoRenderPass",
                targets: [
                    this.ssaoRenderTexture.GetTarget(),
                ]
            },
        });

        this.blurHorizontalRenderPipeline = GPU.CreateRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "blurHorizontalRenderPass",
                targets: [
                    this.blurHorizontalRenderTexture.GetTarget(),
                ]
            },
        });

        this.blurVerticalRenderPipeline = GPU.CreateRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "blurVerticalRenderPass",
                targets: [
                    this.blurVerticalRenderTexture.GetTarget(),
                ]
            },
        });

        this.sceneRenderPipeline = GPU.CreateRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs"
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "sceneRenderPass",
                targets: [
                    this.sceneRenderTexture.GetTarget(),
                ]
            },
        });

        this.ssaoBindGroup = GPU.CreateBindGroup({
            layout: this.ssaoRenderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: this.noiseSampler },
                this.gBufferRenderPass.positionRenderTexture.GetBindGroupEntry(3),
                this.gBufferRenderPass.normalRenderTexture.GetBindGroupEntry(4),
                { binding: 5, resource: this.noiseTextureView },
            ],
        });

        this.blurHorizontalBindGroup = GPU.CreateBindGroup({
            layout: this.blurHorizontalRenderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                this.ssaoRenderTexture.GetBindGroupEntry(6),
            ],
        });

        this.blurVerticalBindGroup = GPU.CreateBindGroup({
            layout: this.blurVerticalRenderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                this.blurHorizontalRenderTexture.GetBindGroupEntry(6),
            ],
        });

        this.sceneBindGroup = GPU.CreateBindGroup({
            layout: this.sceneRenderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 1, resource: this.sampler },
                this.blurVerticalRenderTexture.GetBindGroupEntry(6),
                this.inputRenderTexture.GetBindGroupEntry(7),
            ],
        });
    }

    Render(camera, scene, commandEncoder) {
        this.uniformValues.set(Camera.main.viewMatrix, this.ssaoKernel.length);
        this.uniformValues.set(Camera.main.projectionMatrix, this.ssaoKernel.length + 16);
        this.uniformValues.set([this.canvas.width, this.canvas.height, this.radius, this.bias, this.blurRadius, this.sigmaDepth, this.strength], this.ssaoKernel.length + 32);

        //ssaoRenderPass
        const ssaoRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.ssaoRenderTexture.GetColorAttachment(),
            ],
        });
        ssaoRenderPass.setPipeline(this.ssaoRenderPipeline);
        ssaoRenderPass.setBindGroup(0, this.ssaoBindGroup);
        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
        ssaoRenderPass.draw(6);
        ssaoRenderPass.end();

        //blurHorizontalRenderPass
        const blurHorizontalRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.blurHorizontalRenderTexture.GetColorAttachment(),
            ],
        });
        blurHorizontalRenderPass.setPipeline(this.blurHorizontalRenderPipeline);
        blurHorizontalRenderPass.setBindGroup(0, this.blurHorizontalBindGroup);
        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
        blurHorizontalRenderPass.draw(6);
        blurHorizontalRenderPass.end();

        //blurVerticalRenderPass
        const blurVerticalRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.blurVerticalRenderTexture.GetColorAttachment(),
            ],
        });
        blurVerticalRenderPass.setPipeline(this.blurVerticalRenderPipeline);
        blurVerticalRenderPass.setBindGroup(0, this.blurVerticalBindGroup);
        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
        blurVerticalRenderPass.draw(6);
        blurVerticalRenderPass.end();

        //sceneRenderPass
        const sceneRenderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                this.sceneRenderTexture.GetColorAttachment(),
            ],
        });
        sceneRenderPass.setPipeline(this.sceneRenderPipeline);
        sceneRenderPass.setBindGroup(0, this.sceneBindGroup);
        GPU.Queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
        sceneRenderPass.draw(6);
        sceneRenderPass.end();
    }

    GenerateKernel(size = 64) {
        const kernel = [];

        for (let i = 0; i < size; i++) {
            let sample = new Vector3(
                Mathf.Random() * 2.0 - 1.0,
                Mathf.Random() * 2.0 - 1.0,
                Mathf.Random()
            );

            sample.Normalize();
            sample = Vector3.Multiply(sample, Mathf.Random());

            kernel.push(sample[0], sample[1], sample[2], 0);
        }

        return kernel;
    }

}