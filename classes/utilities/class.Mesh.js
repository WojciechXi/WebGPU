class Mesh {

    constructor(name) {
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
        this.colors = [];
        this.vertices = [];
        this.normals = [];
        this.uvs = [];
        this.triangles = [];
    }

    Update(mesh) {
        this.colors = [];
        this.vertices = [];
        this.normals = [];
        this.uvs = [];
        this.triangles = [];

        for (let color of mesh.colors) {
            this.colors.push(color.r);
            this.colors.push(color.g);
            this.colors.push(color.b);
        }

        for (let vertex of mesh.vertices) {
            this.vertices.push(vertex.x);
            this.vertices.push(vertex.y);
            this.vertices.push(vertex.z);
        }

        for (let normal of mesh.normals) {
            this.normals.push(normal.x);
            this.normals.push(normal.y);
            this.normals.push(normal.z);
        }

        for (let uv of mesh.uvs) {
            this.uvs.push(uv.x);
            this.uvs.push(uv.y);
        }

        for (let triangle of mesh.triangles) {
            this.triangles.push(triangle);
        }
    }

}