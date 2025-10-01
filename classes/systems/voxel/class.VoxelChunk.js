class VoxelChunk extends Component {

    Init() {
        this.voxelChunkData = new VoxelChunkData();
        this.meshRenderer = this.GetComponent(MeshRenderer);
    }

    Generate() {
        for (let i = 0; i < VoxelChunkData.volume; i++) {
            this.voxelChunkData.voxels[i] = Math.random() > 0.5 ? 1 : 0;
        }
    }

    BuildMesh() {
        let mesh = this.meshRenderer.mesh;
        if (!mesh) mesh = new Mesh({
            name: `Chunk`,
            subMeshes: [
                new SubMesh({}),
            ],
        });

        let vertices = [];
        let uvs = [];
        let triangles = [];
        for (let x = 0; x < VoxelChunkData.resolution; x++) {
            for (let z = 0; z < VoxelChunkData.resolution; z++) {
                for (let y = 0; y < VoxelChunkData.resolution; y++) {
                    let index = y + z * VoxelChunkData.resolution + x * VoxelChunkData.area;

                    let position = new Vector3(x + 0.5, y + 0.5, z + 0.5);
                    vertices.push(Vector3.Add(position, new Vector3(-0.5, -0.5, -0.5)));
                    uvs.push(Vector2.zero);
                    triangles.push(vertices.length - 1);

                    vertices.push(Vector3.Add(position, new Vector3(-0.5, 0.5, -0.5)));
                    uvs.push(Vector2.up);
                    triangles.push(vertices.length - 1);

                    vertices.push(Vector3.Add(position, new Vector3(0.5, -0.5, -0.5)));
                    uvs.push(Vector2.right);
                    triangles.push(vertices.length - 1);
                }
            }
        }

        mesh.vertices = vertices;
        mesh.uvs = uvs;
        mesh.SetTriangles(triangles, 0);

        mesh.RecalculateNormals();
        mesh.RecalculateTangents();
        mesh.RecalculateBounds();
        mesh.Update();

        this.meshRenderer.mesh = mesh;
    }

}