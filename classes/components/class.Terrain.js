class Terrain extends Component {

    Init() {
        this.resolution = 128;
        this.heights = new Float32Array(this.resolution * this.resolution);
        this.material = null;
        this._mesh = new Mesh("Terrain");
        this._vertexBuffer = null;

        for (let i = 0; i < this.heights.length; i++)this.heights[i] = Math.random();

        this.BuildMesh();
    }

    BuildMesh() {
        this._mesh.Clear();

        let halfResolution = this.resolution / 2;
        for (let x = 0; x < this.resolution; x++) {
            for (let z = 0; z < this.resolution; z++) {
                let index = (x) + (z) * this.resolution;
                let indexForward = (x) + (z + 1) * this.resolution;
                let indexRight = (x + 1) + (z) * this.resolution;
                let indexForwardRight = (x + 1) + (z + 1) * this.resolution;

                this._mesh.vertices.push(new Vector3(x - halfResolution, this.heights[index], z - halfResolution));
                this._mesh.normals.push(Vector3.up);
                this._mesh.uvs.push(new Vector2(x, z));
                this._mesh.triangles.push(this._mesh.vertices.length - 1);

                this._mesh.vertices.push(new Vector3(x - halfResolution + 1, this.heights[indexRight], z - halfResolution));
                this._mesh.normals.push(Vector3.up);
                this._mesh.uvs.push(new Vector2(x + 1, z));
                this._mesh.triangles.push(this._mesh.vertices.length - 1);

                this._mesh.vertices.push(new Vector3(x - halfResolution, this.heights[indexForward], z - halfResolution + 1));
                this._mesh.normals.push(Vector3.up);
                this._mesh.uvs.push(new Vector2(x, z + 1));
                this._mesh.triangles.push(this._mesh.vertices.length - 1);

                this._mesh.vertices.push(new Vector3(x - halfResolution + 1, this.heights[indexRight], z - halfResolution));
                this._mesh.normals.push(Vector3.up);
                this._mesh.uvs.push(new Vector2(x + 1, z));
                this._mesh.triangles.push(this._mesh.vertices.length - 1);

                this._mesh.vertices.push(new Vector3(x - halfResolution, this.heights[indexForward], z - halfResolution + 1));
                this._mesh.normals.push(Vector3.up);
                this._mesh.uvs.push(new Vector2(x, z + 1));
                this._mesh.triangles.push(this._mesh.vertices.length - 1);

                this._mesh.vertices.push(new Vector3(x - halfResolution + 1, this.heights[indexForwardRight], z - halfResolution + 1));
                this._mesh.normals.push(Vector3.up);
                this._mesh.uvs.push(new Vector2(x + 1, z + 1));
                this._mesh.triangles.push(this._mesh.vertices.length - 1);
            }
        }

        this._mesh.Update();

        if (this._vertexBuffer) this._vertexBuffer.destroy();

        if (this._mesh) {
            this._vertexBuffer = GPU.CreateBuffer({
                label: 'vertex buffer vertices',
                size: this._mesh.meshBuffer.data.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });

            GPU.Queue.writeBuffer(this._vertexBuffer, 0, this._mesh.meshBuffer.data);
        }
    }

    Render(renderPass, pipeline) {
        if (!this.material || !this._mesh) return;

        // ustaw shader i uniformy
        this.material.Use(renderPass, pipeline, this.transform.matrix4x4, Camera.main.viewMatrix, Camera.main.projectionMatrix, Camera.main.viewProjectionMatrix);

        // użyj istniejącego vertex buffer
        renderPass.setVertexBuffer(0, this._vertexBuffer);
        renderPass.draw(this._mesh.triangles.length);
    }

    Destroy() {
        if (this._vertexBuffer) {
            this._vertexBuffer.destroy();
            this._vertexBuffer = null;
        }
    }

}