class TriangleMeshGeometry {

    constructor(mesh) {
        this.mesh = mesh;
    }

    get vertices() {
        return this.mesh._vertices;
    }

    get triangles() {
        return this.mesh.subMeshes[0].triangles;
    }

    GetVertex(index) {
        return this.mesh._vertices[index];
    }

}