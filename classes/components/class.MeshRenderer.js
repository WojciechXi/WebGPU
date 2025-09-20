class MeshRenderer extends Component {

    Init() {
        this.material = null;
        this._mesh = null;
        this.vertexBuffer = null;
    }

    get mesh() { return this._mesh; }
    set mesh(mesh) {
        this._mesh = mesh;

        if (this.vertexBuffer) this.vertexBuffer.destroy();

        if (this._mesh) {
            this.vertexBuffer = Graphics.device.createBuffer({
                label: 'vertex buffer vertices',
                size: mesh.meshBuffer.data.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });

            Graphics.device.queue.writeBuffer(this.vertexBuffer, 0, mesh.meshBuffer.data);
        }
    }

    Render() {
        if (!this.mesh || !this.material) return;

        // ustaw shader i uniformy
        this.material.Use(Graphics.pass, Camera.main.viewProjectionMatrix, this.transform.matrix4x4);

        // użyj istniejącego vertex buffer
        Graphics.pass.setVertexBuffer(0, this.vertexBuffer);
        Graphics.pass.draw(this.mesh.triangles.length);
    }

    Destroy() {
        if (this.vertexBuffer) {
            this.vertexBuffer.destroy();
            this.vertexBuffer = null;
        }
    }
}
