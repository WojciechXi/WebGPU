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

    DrawMesh(mesh, subMeshIndex, matrixBuffer) {
        const subMesh = mesh.GetSubMesh(subMeshIndex);

        this.SetVertexBuffer(0, mesh.vertexBuffer.buffer);
        this.SetVertexBuffer(1, matrixBuffer);
        this.SetBindGroup(3, this.emptyBindGroup);
        this.SetIndexBuffer(subMesh.triangleBuffer.buffer, 'uint32');
        this.DrawIndexed(subMesh.triangleBuffer.count);
    }

    DrawSkinnedMesh(mesh, subMeshIndex, matrixBuffer, jointsBindGroup) {
        const subMesh = mesh.GetSubMesh(subMeshIndex);

        this.SetVertexBuffer(0, mesh.vertexBuffer.buffer);
        this.SetVertexBuffer(1, matrixBuffer);
        this.SetBindGroup(3, jointsBindGroup);

        this.SetIndexBuffer(subMesh.triangleBuffer.buffer, 'uint32');
        this.DrawIndexed(subMesh.triangleBuffer.count);
    }

}