class Furniture extends GameBehaviour {

    constructor() {
        super();

        new Property(this, 'material', null, {
            assigned: material => {
                console.log(material);
                if (this.meshRenderer) this.meshRenderer.sharedMaterial = material;
            }
        });

        new Property(this, 'mesh', null, {
            assigned: mesh => {
                if (this.meshRenderer) this.meshRenderer.sharedMesh = mesh;
            }
        });

        new Property(this, 'meshRenderer', null);

        new Property(this, 'rootNode', new FurnitureNode());

        new Property(this, 'width', 600);
        new Property(this, 'height', 800);
        new Property(this, 'depth', 600);

        new Property(this, 'thickness', 18);
        new Property(this, 'hasBack', true);
        new Property(this, 'backThickness', 3);
    }

    OnEnable() {
        this.meshRenderer = this.GetComponent(MeshRenderer) ?? this.AddComponent(MeshRenderer);
        if (!this.mesh) this.mesh = new Mesh();
    }

    ClearShelves() {
        this.shelves.length = 0;
    }

    Build() {
        this.mesh.Clear();

        let allVertices = [];
        let allNormals = [];
        let allUvs = [];
        let subMeshes = [];

        let currentVertexOffset = 0;

        const addBox = (min, max) => {
            const boxData = GeometryData.Cube(Vector3.Multiply(min, 0.001), Vector3.Multiply(max, 0.001));

            for (let v of boxData.vertices) allVertices.push(v);
            for (let n of boxData.normals) allNormals.push(n);
            for (let uv of boxData.uvs) allUvs.push(uv);

            const triangles = boxData.triangles.map(idx => idx + currentVertexOffset);
            currentVertexOffset += boxData.vertices.length;

            return triangles;
        };

        let bodyTriangles = [];
        const t = this.thickness;
        const w = this.width;
        const h = this.height;
        const d = this.depth;

        const b = this.hasBack ? this.backThickness : 0;

        if (this.hasBack) {
            bodyTriangles.push(...addBox(
                new Vector3(0, 0, 0),
                new Vector3(w, h, b)
            ));
        }

        bodyTriangles.push(...addBox(
            new Vector3(0, 0, b),
            new Vector3(w, t, d)
        ));

        bodyTriangles.push(...addBox(
            new Vector3(0, h - t, b),
            new Vector3(w, h, d)
        ));

        bodyTriangles.push(...addBox(
            new Vector3(0, 0, b),
            new Vector3(t, h, d)
        ));

        bodyTriangles.push(...addBox(
            new Vector3(w - t, 0, b),
            new Vector3(w, h, d)
        ));

        this.rootNode.Build(bodyTriangles, addBox, new Vector3(
            t,
            t,
            b
        ), new Vector3(
            w - t,
            h - t,
            d - b
        ), this.thickness);

        const bodySubMesh = new SubMesh();
        bodySubMesh.SetTriangles(bodyTriangles);
        subMeshes.push(bodySubMesh);

        this.mesh.SetVertices(allVertices, false);
        this.mesh.SetNormals(allNormals);
        this.mesh.SetUVs(allUvs, 0);
        this.mesh.SetSubMeshes(subMeshes);

        this.mesh.RecalculateTangents();
        this.mesh.RecalculateBounds();

        this.mesh.UploadMeshData();

        return this.mesh;
    }

}