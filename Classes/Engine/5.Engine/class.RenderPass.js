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

    SetPipeline(renderPipeline) {
        this.renderPass.setPipeline(renderPipeline);
    }

    SetBindGroup(index, bindGroup) {
        this.renderPass.setBindGroup(index, bindGroup);
    }

    SetVertexBuffer(slot, buffer) {
        this.renderPass.setVertexBuffer(slot, buffer);
    }

    SetIndexBuffer(buffer, format = 'uint16') {
        this.renderPass.setIndexBuffer(buffer, format);
    }

    Draw(count) {
        this.renderPass.draw(count);
    }

    DrawIndexed(count) {
        this.renderPass.drawIndexed(count);
    }

}