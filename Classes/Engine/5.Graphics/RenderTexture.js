class RenderTexture {

    constructor(width, height, options = {}) {
        this.width = width;
        this.height = height;

        this.format = options.format ?? 'rgba8unorm';

        this.texture = GPU.CreateTexture({
            size: [width, height, 1],
            format: this.format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });

        this.textureView = this.texture.createView();
    }

    GetBindGroupLayoutEntry(binding = 0, visibility = GPUShaderStage.FRAGMENT, sampleType = 'float', multisampled = false, viewDimension = '2d') {
        return {
            binding: binding,
            visibility: visibility,
            texture: {
                sampleType: sampleType,
                viewDimension: viewDimension,
                multisampled: multisampled,
            },
        };
    }

    GetBindGroupEntry(binding = 0) {
        return {
            binding: binding,
            resource: this.textureView
        };
    }

    GetColorAttachment(loadOp = 'clear', storeOp = 'store', clearValue = { r: 0, g: 0, b: 0, a: 0 }) {
        return { view: this.textureView, loadOp: loadOp, storeOp: storeOp, clearValue: clearValue };
    }

    GetDepthStencilAttachment() {
        return { view: this.textureView, depthClearValue: 1.0, depthLoadOp: "clear", depthStoreOp: "store", };
    }

    GetTarget() {
        return { format: this.format };
    }

}