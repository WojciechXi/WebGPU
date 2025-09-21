class MeshRenderer extends Component {

    Init() {
        this.material = null;
        this._mesh = null;
        this._vertexBuffer = null;
    }

    get mesh() { return this._mesh; }
    set mesh(mesh) {
        this._mesh = mesh;

        if (this._vertexBuffer) this._vertexBuffer.destroy();

        if (this._mesh) {
            this._vertexBuffer = Graphics.device.createBuffer({
                label: 'vertex buffer vertices',
                size: mesh.meshBuffer.data.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });

            Graphics.device.queue.writeBuffer(this._vertexBuffer, 0, mesh.meshBuffer.data);
        }
    }

    Render() {
        if (!this.mesh || !this.material) return;

        // ustaw shader i uniformy
        this.material.Use(Graphics.passEncoder, Camera.main.viewProjectionMatrix, Camera.main.viewProjectionInverseMatrix, this.transform.matrix4x4);

        // użyj istniejącego vertex buffer
        Graphics.passEncoder.setVertexBuffer(0, this._vertexBuffer);
        Graphics.passEncoder.draw(this.mesh.triangles.length);
    }

    Destroy() {
        if (this._vertexBuffer) {
            this._vertexBuffer.destroy();
            this._vertexBuffer = null;
        }
    }
}
