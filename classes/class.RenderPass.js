class RenderPass {

    constructor(data) {
        this.name = data.name ?? 'renderPass';
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

    SetBindGroup(index, bindGroup) {
        this.renderPass.setBindGroup(index, bindGroup);
    }

    SetPipeline(renderPipeline) {
        this.renderPass.setPipeline(renderPipeline);
    }

    SetVertexBuffer(slot, buffer, offset = 0, size = 0) {
        this.renderPass.setVertexBuffer(slot, buffer, offset, size ? size : buffer.size);
    }

    SetIndexBuffer(buffer, format = 'uint16', offset = 0, size = 0) {
        this.renderPass.setIndexBuffer(buffer, format, offset, size ? size : buffer.size);
    }

    Draw(count) {
        this.renderPass.draw(count);
    }

}