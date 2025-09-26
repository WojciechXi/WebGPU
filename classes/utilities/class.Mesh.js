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

}

class SubMesh {

    constructor(data = {}) {
        this.vertices = data.vertices ?? [];
        this.normals = data.normals ?? [];
        this.tangents = data.tangents ?? [];
        this.colors = data.colors ?? [];
        this.uvs = data.uvs ?? [];
        this.triangles = data.triangles ?? new Uint32Array(0);
        this.meshBuffer = new MeshBuffer(this);
    }

    Clear() {
        this.vertices = [];
        this.normals = [];
        this.tangents = [];
        this.colors = [];
        this.uvs = [];
        this.triangles = new Uint32Array(0);
        this.meshBuffer.Clear();
    }

    Update() {
        this.meshBuffer.Update(this);
    }

}

class MeshBuffer {

    constructor() {
        this.data = new Float32Array(0);
    }

    Clear() {
        this.data = new Float32Array(0);
    }

    Update(subMesh) {
        let offset = 3 + 3 + 4 + 4 + 2; // position + normal + tangent + color + uv
        this.data = new Float32Array(subMesh.vertices.length * offset); // 3 + 3 + 4 + 2 = 12
        for (let i = 0; i < subMesh.vertices.length; i++) {
            let vertex = subMesh.vertices[i] ?? new Vector3(0, 0, 0);
            let normal = subMesh.normals[i] ?? new Vector3(0, 0, 0);
            let tangent = subMesh.tangents[i] ?? new Vector4(0, 0, 0, 1);
            let color = subMesh.colors[i] ?? new Color(1, 1, 1);
            let uv = subMesh.uvs[i] ?? new Vector2(0, 0);

            this.data.set([
                vertex.x, vertex.y, vertex.z,
                normal.x, normal.y, normal.z,
                tangent.x, tangent.y, tangent.z, tangent.w,
                color.r, color.g, color.b, color.a,
                uv.x, uv.y
            ], i * offset);
        }
    }

}