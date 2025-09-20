class Mesh {

    constructor(name = 'Mesh') {
        this.name = name;
        this.colors = [];
        this.vertices = [];
        this.normals = [];
        this.uvs = [];
        this.triangles = [];
        this.meshBuffer = new MeshBuffer();
    }

    Update() {
        this.meshBuffer.Update(this);
    }

}

class MeshBuffer {

    constructor() {
        this.data = new Float32Array(0);
    }

    Update(mesh) {
        let offset = 3 + 3 + 2;
        this.data = new Float32Array(mesh.triangles.length * offset);

        for (let i = 0; i < mesh.triangles.length; i++) {
            let index = mesh.triangles[i];

            let vertex = mesh.vertices[index];
            let normal = mesh.normals[index];
            let uv = mesh.uvs[index];

            if (vertex) this.data.set(vertex, i * offset);
            if (normal) this.data.set(normal, i * offset + 3);
            if (uv) this.data.set(uv, i * offset + 3);
        }
    }

}