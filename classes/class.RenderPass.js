class RenderPass {

    constructor(shaderCode, canvas) {
        this.shaderModule = GPU.CreateShaderModule({ code: shaderCode });
        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });

        this.Init(canvas);
    }

    Init(canvas) {

    }

    Render(engine, commandEncoder) {

    }

}