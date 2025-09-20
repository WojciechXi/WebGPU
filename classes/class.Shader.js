class Shader {

    constructor(code, renderPipelineBuffers, buffers) {
        this.code = code;
        this.renderPipelineBuffers = renderPipelineBuffers;
        this.buffers = buffers;
        this.module = null;
        this.pipeline = null;
    }

    Compile(imageBitmap) {
        const device = Graphics.device;
        const context = Graphics.context;

        // Konfiguracja kontekstu
        const presentationFormat = this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
            device,
            format: presentationFormat,
            alphaMode: 'premultiplied',
        });

        // Tworzymy shader module
        this.module = device.createShaderModule({ code: this.code });

        // Tworzymy pipeline
        this.pipeline = device.createRenderPipeline({
            label: 'shader pipeline',
            layout: 'auto',
            vertex: {
                module: this.module,
                entryPoint: 'vs',
                buffers: this.renderPipelineBuffers
            },
            fragment: {
                module: this.module,
                entryPoint: 'fs',
                targets: [{ format: presentationFormat }],
            },
            primitive: {
                cullMode: "back",
                frontFace: "cw",
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            },
        });

        // Tworzymy buffer uniformów (mat4x4 = 16 floatów, vec4 = 4 floatów, vec3 = 3 floaty + padding)
        const uniformSize = (16 + 16 + 4 + 4 + 4 + 4) * 4; // VP + model + color + lightDirection + lightColor + ambientLightColor
        this.uniformBuffer = device.createBuffer({
            label: 'uniform buffer',
            size: uniformSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Float32Array do łatwego ustawiania wartości
        this.uniformValues = new Float32Array(uniformSize / 4);
        this.viewProjectionMatrix = this.uniformValues.subarray(0, 16);
        this.modelMatrix = this.uniformValues.subarray(16, 32);
        this.color = this.uniformValues.subarray(32, 36);
        this.lightDirection = this.uniformValues.subarray(36, 39);
        this.lightColor = this.uniformValues.subarray(40, 44);
        this.ambientLightColor = this.uniformValues.subarray(44, 48);

        // Tworzymy teksturę i sampler
        this.texture = device.createTexture({
            size: [imageBitmap.width, imageBitmap.height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: this.texture },
            [imageBitmap.width, imageBitmap.height, 1]
        );

        this.sampler = device.createSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        // Bind group: uniform + texture + sampler
        this.bindGroup = device.createBindGroup({
            label: 'bind group',
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: this.texture.createView() },
            ],
        });
    }

    Use(passEncoder) {
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, this.bindGroup);
        Graphics.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
    }

    SetViewProjectionMatrix(matrix) {
        this.viewProjectionMatrix.set(matrix);
    }

    SetModelMatrix(matrix) {
        this.modelMatrix.set(matrix);
    }

    SetColor(color) {
        this.color.set(color);
    }

    SetLightDirection(direction) {
        this.lightDirection.set(direction);
    }

    SetLightColor(color) {
        this.lightColor.set(color);
    }

    SetAmbientLightColor(color) {
        this.ambientLightColor.set(color);
    }

}
