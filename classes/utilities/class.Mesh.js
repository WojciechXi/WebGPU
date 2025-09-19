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
        this.data = new Float32Array(mesh.triangles.length * (3 + 3));

        for (let i = 0; i < mesh.triangles.length; i++) {
            let index = mesh.triangles[i];

            let vertex = mesh.vertices[index];
            let normal = mesh.normals[index];

            if (vertex) this.data.set(vertex, i * 6);
            if (normal) this.data.set(normal, i * 6 + 3);
        }
    }

}