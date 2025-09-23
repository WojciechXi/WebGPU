class RenderPass {

    constructor(data) {
        this.shaderModule = data.code ? GPU.CreateShaderModule({ code: data.code }) : null;
        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });
        this.renderPipeline = null;

        this.Init(data);
    }

    Init(data) {

    }

    Render(engine, commandEncoder) {

    }

}