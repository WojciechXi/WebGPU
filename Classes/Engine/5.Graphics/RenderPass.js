class RenderPass {

    constructor(data) {
        this.name = data.name ?? 'renderPass';
        this.canvas = data.canvas ?? null;
        this.shaderModule = data.code ? GPU.CreateShaderModule({ code: data.code }) : null;
        this.sampler = GPU.CreateSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
        });
        this.renderPipeline = null;

        this.emptyBuffer = new Buffer(64 * 16, { usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, });
        this.emptyBindGroup = GPU.CreateBindGroup({
            label: 'EmptyBindGroup',
            layout: Graphics.jointsBindGroupLayout,
            entries: [
                this.emptyBuffer.GetBindGroupEntry(0),
            ],
        });

        this.Init(data);
    }

    GetTargets() {
        return [];
    }

    Init(data) {

    }

    Render(camera, scene, commandEncoder) {

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

    SetShader(shader, state) {
        const renderPipeline = shader.GetPipeline(this, state);
        if (renderPipeline) this.renderPass.setPipeline(renderPipeline);
        return renderPipeline;
    }

    SetMaterial(material) {
        const renderPipeline = this.SetShader(material.shader, {
            cull: material.cull,
            depthWrite: material.depthWrite,
        });

        if (renderPipeline) {
            this.SetBindGroup(1, material.materialBindGroup);
            this.SetBindGroup(2, material.pbrBindGroup);
        }

        return renderPipeline;
    }

    Draw(count) {
        this.renderPass.draw(count);
    }

    DrawIndexed(count) {
        this.renderPass.drawIndexed(count);
    }

}