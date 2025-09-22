class GPU {

    static {
        this.adapter = null;
        this.device = null;
    }

    static async Request() {
        this.adapter = await navigator.gpu?.requestAdapter();
        this.device = await this.adapter?.requestDevice();

        return this.device;
    }

    static get Queue() {
        return this.device.queue;
    }

    static CreateShaderModule(data, callback = null) {
        const shaderModule = this.device.createShaderModule(data);
        if (callback) callback(shaderModule);
        return shaderModule;
    }

    static CreateTexture(data, callback = null) {
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