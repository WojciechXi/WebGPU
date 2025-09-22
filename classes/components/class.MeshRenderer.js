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
            this._vertexBuffer = GPU.CreateBuffer({
                label: 'vertex buffer vertices',
                size: mesh.meshBuffer.data.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });

            GPU.Queue.writeBuffer(this._vertexBuffer, 0, mesh.meshBuffer.data);
        }
    }

    Render(renderPass) {
        if (!this.mesh || !this.material) return;

        // ustaw shader i uniformy
        this.material.Use(renderPass, Camera.main.viewProjectionMatrix, Camera.main.viewProjectionInverseMatrix, this.transform.matrix4x4);

        // użyj istniejącego vertex buffer
        renderPass.setVertexBuffer(0, this._vertexBuffer);
        renderPass.draw(this.mesh.triangles.length);
    }

    Destroy() {
        if (this._vertexBuffer) {
            this._vertexBuffer.destroy();
            this._vertexBuffer = null;
        }
    }
}
