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

    static CreateTexture(data) {
        return this.device.createTexture(data);
    }

    static CreateBuffer(data) {
        return this.device.createBuffer(data);
    }

    static CreateSampler(data) {
        return this.device.createSampler(data);
    }

    static CreateBindGroup(data) {
        return this.device.createBindGroup(data);
    }

    static CreateCommandEncoder() {
        return this.device.createCommandEncoder();
    }

}