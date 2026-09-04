class GPU {

    static {
        this.adapter = null;
        this.device = null;
    }

    static async Request() {
        const adapter = this.adapter = await navigator.gpu?.requestAdapter();
        const device = this.device = await this.adapter?.requestDevice();
        const limits = this.limits = device.limits;

        console.log("🔍 Limity GPU:", limits);

        // === Wrapper na createBuffer ===
        const originalCreateBuffer = device.createBuffer.bind(device);
        device.createBuffer = (desc) => {
            if (desc.size > limits.maxBufferSize) {
                console.warn(
                    `⚠️ Próba stworzenia bufora ${desc.size} bajtów > maxBufferSize ${limits.maxBufferSize}`
                );
            }
            if (
                desc.usage & GPUBufferUsage.STORAGE &&
                desc.size > limits.maxStorageBufferBindingSize
            ) {
                console.warn(
                    `⚠️ Storage buffer za duży: ${desc.size} bajtów > ${limits.maxStorageBufferBindingSize}`
                );
            }
            if (
                desc.usage & GPUBufferUsage.UNIFORM &&
                desc.size > limits.maxBufferBindingSize
            ) {
                console.warn(
                    `⚠️ Uniform buffer za duży: ${desc.size} bajtów > ${limits.maxBufferBindingSize}`
                );
            }
            return originalCreateBuffer(desc);
        };

        // === Wrapper na createTexture ===
        const originalCreateTexture = device.createTexture.bind(device);
        device.createTexture = (desc) => {
            const { width, height, depthOrArrayLayers = 1 } = desc.size;
            if (width > limits.maxTextureDimension2D || height > limits.maxTextureDimension2D) {
                console.warn(
                    `⚠️ Tekstura ${width}x${height} przekracza maxTextureDimension2D ${limits.maxTextureDimension2D}`
                );
            }
            if (depthOrArrayLayers > limits.maxTextureArrayLayers) {
                console.warn(
                    `⚠️ Za dużo warstw w teksturze: ${depthOrArrayLayers} > ${limits.maxTextureArrayLayers}`
                );
            }
            return originalCreateTexture(desc);
        };

        return this.device;
    }

    static get Queue() {
        return this.device.queue;
    }

    static CreatePipelineLayout(data, callback = null) {
        const pipelineLayout = this.device.createPipelineLayout(data);
        if (callback) callback(pipelineLayout);
        return pipelineLayout;
    }

    static CreateShaderModule(data, callback = null) {
        const shaderModule = this.device.createShaderModule(data);
        if (callback) callback(shaderModule);
        return shaderModule;
    }

    static CreateTexture(data, callback = null) {
        console.log(data);
        const texture = this.device.createTexture(data);
        if (callback) callback(texture);
        return texture;
    }

    static CreateBuffer(data, callback = null) {
        const buffer = this.device.createBuffer(data);
        if (callback) callback(buffer);
        return buffer;
    }

    static CreateSampler(data, callback = null) {
        const sampler = this.device.createSampler(data);
        if (callback) callback(sampler);
        return sampler;
    }

    static CreateBindGroupLayout(data, callback = null) {
        const bindGroupLayout = this.device.createBindGroupLayout(data);
        if (callback) callback(bindGroupLayout);
        return bindGroupLayout;
    }

    static CreateBindGroup(data, callback = null) {
        const bindGroup = this.device.createBindGroup(data);
        if (callback) callback(bindGroup);
        return bindGroup;
    }

    static CreateCommandEncoder(callback = null) {
        const commandEncoder = this.device.createCommandEncoder();
        if (callback) callback(commandEncoder);
        return commandEncoder;
    }

    static CreateRenderPipeline(data, callback = null) {
        const renderPipeline = this.device.createRenderPipeline(data);
        if (callback) callback(renderPipeline);
        return renderPipeline;
    }

}