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
        this.triangles = new Uint32Array(data.triangles ?? 0);
        this.material = data.material ?? null;

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
        renderPass.SetIndexBuffer(this.indexBuffer, 'uint32');
        renderPass.SetVertexBuffer(0, this.vertexBuffer);
        renderPass.DrawIndexed(this.triangles.length);
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
        let offset = 4 + 4 + 4 + 4 + 4; // position + normal + tangent + color + uv
        let data = new Float32Array(this.vertices.length * offset);

        for (let i = 0; i < this.vertices.length; i++) {
            let vertex = this.vertices[i] ?? new Vector3(0, 0, 0);
            let normal = this.normals[i] ?? new Vector3(0, 0, 0);
            let tangent = this.tangents[i] ?? new Vector4(0, 0, 0, 1);
            let color = this.colors[i] ?? new Color(1, 1, 1);
            let uv = this.uvs[i] ?? new Vector2(0, 0);

            data.set([
                vertex.x, vertex.y, vertex.z, 0,
                normal.x, normal.y, normal.z, 0,
                tangent.x, tangent.y, tangent.z, tangent.w,
                color.r, color.g, color.b, color.a,
                uv.x, uv.y, 0, 0
            ], i * offset);
        }

        if (this.vertexBuffer) this.vertexBuffer.destroy();
        this.vertexBuffer = GPU.CreateBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        GPU.Queue.writeBuffer(this.vertexBuffer, 0, data);

        if (this.indexBuffer) this.indexBuffer.destroy();
        this.indexBuffer = GPU.CreateBuffer({
            size: this.triangles.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        GPU.Queue.writeBuffer(this.indexBuffer, 0, this.triangles);
    }

}