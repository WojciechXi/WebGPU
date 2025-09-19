class MeshRenderer extends Component {

    Init() {
        this.mesh = null;
        this.material = null;
    }

    Render() {
        if (!this.mesh || !this.material) return;

        let material = this.material;

        material.Use(Camera.main.viewProjectionMatrix, this.transform.matrix4x4);

        this.vertexBuffer = Graphics.device.createBuffer({
            label: 'vertex buffer vertices',
            size: this.mesh.meshBuffer.data.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        Graphics.device.queue.writeBuffer(this.vertexBuffer, 0, this.mesh.meshBuffer.data);
        Graphics.pass.setVertexBuffer(0, this.vertexBuffer);
        Graphics.pass.draw(this.mesh.triangles.length);
    }

    PostRender() {
        if (this.vertexBuffer) {
            this.vertexBuffer.destroy();
            this.vertexBuffer = null;
        }
    }

}