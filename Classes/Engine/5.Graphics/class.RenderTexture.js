class RenderTexture {

    constructor(width, height, options = {}) {
        this.width = width;
        this.height = height;

        this.format = options.format ?? 'rgba8unorm';
        this.useDepth = options.depth ?? false;
        this.useStencil = options.stencil ?? false;

        this.texture = GPU.CreateTexture({
            size: [width, height, 1],
            format: this.format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        this.textureView = this.texture.createView();

        if (this.useDepth) {
            this.depthTexture = GPU.CreateTexture({
                size: [width, height, 1],
                format: "depth32float",
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            });
            this.depthView = this.depthTexture.createView();
        }
    }

    GetRenderPassDescriptor(clearColor = { r: 0, g: 0, b: 0, a: 1 }) {
        const renderPassDescriptor = {
            colorAttachments: [
                this.GetColorAttachment(clearColor),
            ],
        };

        if (this.useDepth) {
            renderPassDescriptor.depthStencilAttachment = {
                view: this.depthView,
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            };
        }

        return renderPassDescriptor;
    }

    GetBindGroupLayoutEntry(binding = 0, visibility = GPUShaderStage.FRAGMENT, texture = { sampleType: 'float' }) {
        return { binding: binding, visibility: visibility, texture: texture, };
    }

    GetColorAttachment(clearColor = { r: 0, g: 0, b: 0, a: 1 }) {
        return { view: this.textureView, loadOp: 'clear', storeOp: 'store', clearValue: clearColor };
    }

    GetBindGroupEntry(binding = 0) {
        return { binding: binding, resource: this.textureView };
    }

    GetTarget() {
        return { format: this.format };
    }

}