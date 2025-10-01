class VoxelChunk extends Component {

    Init() {
        this.meshRenderer = this.GetComponent(MeshRenderer);

        this.voxelChunkData = new VoxelChunkData();
    }

    Generate() {
        for (let i = 0; i < VoxelChunkData.volume; i++) {
            this.voxelChunkData.voxels[i] = Math.random() > 0.5 ? 1 : 0;
            // this.voxelChunkData.voxels[i] = 1;
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
                    let index = VoxelChunkData.Index(x, y, z);
                    let isFilled = this.voxelChunkData.voxels[index];
                    if (!isFilled) continue;

                    let indexLeft = VoxelChunkData.Index(x - 1, y, z);
                    let indexRight = VoxelChunkData.Index(x + 1, y, z);
                    let isLeft = indexLeft < 0 || this.voxelChunkData.voxels[indexLeft];
                    let isRight = indexRight < 0 || this.voxelChunkData.voxels[indexRight];

                    let indexDown = VoxelChunkData.Index(x, y - 1, z);
                    let indexUp = VoxelChunkData.Index(x, y + 1, z);
                    let isDown = indexDown < 0 || this.voxelChunkData.voxels[indexDown];
                    let isUp = indexUp < 0 || this.voxelChunkData.voxels[indexUp];

                    let indexForward = VoxelChunkData.Index(x, y, z + 1);
                    let indexBack = VoxelChunkData.Index(x, y, z - 1);
                    let isForward = indexForward < 0 || this.voxelChunkData.voxels[indexForward];
                    let isBack = indexBack < 0 || this.voxelChunkData.voxels[indexBack];

                    let position = new Vector3(x + 0.5, y + 0.5, -z + 0.5);

                    if (!isForward) this.Face(position, Quaternion.identity, vertices, uvs, triangles);
                    // if (!isRight) this.Face(position, Quaternion.FromEuler(0, 0, 90), vertices, uvs, triangles);
                    // if (!isBack) this.Face(position, Quaternion.FromEuler(0, 0, 180), vertices, uvs, triangles);
                    // if (!isLeft) this.Face(position, Quaternion.FromEuler(0, 0, 270), vertices, uvs, triangles);

                    // if (!isUp) this.Face(position, Quaternion.FromEuler(270, 0, 0), vertices, uvs, triangles);
                    // if (!isDown) this.Face(position, Quaternion.FromEuler(90, 0, 0), vertices, uvs, triangles);
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

    Face(position, rotation, vertices, uvs, triangles) {
        vertices.push(Vector3.Add(position, Quaternion.MultiplyVector3(rotation, new Vector3(-0.5, -0.5, 0.5))));
        uvs.push(Vector2.zero);
        triangles.push(vertices.length - 1);

        vertices.push(Vector3.Add(position, Quaternion.MultiplyVector3(rotation, new Vector3(-0.5, 0.5, 0.5))));
        uvs.push(Vector2.up);
        triangles.push(vertices.length - 1);

        vertices.push(Vector3.Add(position, Quaternion.MultiplyVector3(rotation, new Vector3(0.5, -0.5, 0.5))));
        uvs.push(Vector2.right);
        triangles.push(vertices.length - 1);

        vertices.push(Vector3.Add(position, Quaternion.MultiplyVector3(rotation, new Vector3(-0.5, 0.5, 0.5))));
        uvs.push(Vector2.up);
        triangles.push(vertices.length - 1);

        vertices.push(Vector3.Add(position, Quaternion.MultiplyVector3(rotation, new Vector3(0.5, 0.5, 0.5))));
        uvs.push(Vector2.one);
        triangles.push(vertices.length - 1);

        vertices.push(Vector3.Add(position, Quaternion.MultiplyVector3(rotation, new Vector3(0.5, -0.5, 0.5))));
        uvs.push(Vector2.right);
        triangles.push(vertices.length - 1);
    }

}