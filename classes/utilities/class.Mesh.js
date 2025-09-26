class Mesh {

    constructor(name = 'Mesh') {
        this.name = name;
        this.subMeshes = [];
    }

    Clear() {
        for (let subMesh of this.subMeshes) subMesh.Clear();
        this.subMeshes = [];
        this.Update();
    }

    Update() {
        for (let subMesh of this.subMeshes) subMesh.Update();
    }

    Render(renderPass) {
        for (let subMesh of this.subMeshes) {
            subMesh.Render(renderPass);
            return;
        }
    }

}

class SubMesh {

    constructor(data = {}) {
        this.vertices = data.vertices ?? [];
        this.normals = data.normals ?? [];
        this.tangents = data.tangents ?? [];
        this.colors = data.colors ?? [];
        this.uvs = data.uvs ?? [];
        this.triangles = data.triangles ?? new Uint32Array(0);

        this.indexBuffer = GPU.CreateBuffer({
            size: 0,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        this.vertexBuffer = GPU.CreateBuffer({
            size: 0,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
    }

    Render(renderPass) {
        renderPass.SetIndexBuffer(this.indexBuffer);
        renderPass.SetVertexBuffer(0, this.vertexBuffer);
        renderPass.Draw(this.triangles.length);
    }

    Clear() {
        this.vertices = [];
        this.normals = [];
        this.tangents = [];
        this.colors = [];
        this.uvs = [];
        this.triangles = new Uint32Array(0);
        if (this.indexBuffer) this.indexBuffer.destroy();
        this.indexBuffer = GPU.CreateBuffer({
            size: 0,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        if (this.vertexBuffer) this.vertexBuffer.destroy();
        this.vertexBuffer = GPU.CreateBuffer({
            size: 0,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
    }

    Update() {
        if (this.indexBuffer) this.indexBuffer.destroy();
        this.indexBuffer = GPU.CreateBuffer({
            size: this.triangles.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        GPU.Queue.writeBuffer(this.indexBuffer, 0, this.triangles);

        let offset = 3 + 3 + 4 + 4 + 2; // position + normal + tangent + color + uv
        let data = new Float32Array(this.vertices.length * offset);

        for (let i = 0; i < this.vertices.length; i++) {
            let vertex = this.vertices[i] ?? new Vector3(0, 0, 0);
            let normal = this.normals[i] ?? new Vector3(0, 0, 0);
            let tangent = this.tangents[i] ?? new Vector4(0, 0, 0, 1);
            let color = this.colors[i] ?? new Color(1, 1, 1);
            let uv = this.uvs[i] ?? new Vector2(0, 0);

            data.set([
                vertex.x, vertex.y, vertex.z,
                normal.x, normal.y, normal.z,
                tangent.x, tangent.y, tangent.z, tangent.w,
                color.r, color.g, color.b, color.a,
                uv.x, uv.y
            ], i * offset);
        }

        if (this.vertexBuffer) this.vertexBuffer.destroy();
        this.vertexBuffer = GPU.CreateBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        GPU.Queue.writeBuffer(this.vertexBuffer, 0, data);
    }

}