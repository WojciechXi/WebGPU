class Terrain extends Component {

    Init() {
        this.resolution = 128;
        this.heights = new Float32Array(this.resolution * this.resolution);

        this.receiveShadows = true;
        this.castShadows = true;

        this.material = null;
        this.mesh = new Mesh({
            name: "Terrain",
            subMeshes: [
                new SubMesh({
                    name: 'Terrain',
                }),
            ],
        });

        this.BuildMesh();

        const perlinNoise = new PerlinNoise();
        const heights = [];
        for (let x = 0; x < this.resolution; x++) {
            for (let z = 0; z < this.resolution; z++) {
                heights.push(perlinNoise.NoiseOctave(x * 0.0123, z * 0.0123, 8) * 8);
            }
        }
        this.SetHeights(0, 0, this.resolution, this.resolution, heights);
    }

    SetHeights(x, z, width, height, heights) {
        for (let _x = 0; _x < width; _x++) {
            for (let _z = 0; _z < height; _z++) {
                let xx = x + _x;
                let zz = z + _z;
                let index = (xx) + (zz) * this.resolution;

                this.mesh.vertices[index].y = heights[_x + _z * height];
            }
        }

        this.mesh.Update();
    }

    BuildMesh() {
        const vertices = [];
        const normals = [];
        const tangents = [];
        const uvs = [];

        const halfResolution = this.resolution / 2;
        for (let x = 0; x < this.resolution; x++) {
            for (let z = 0; z < this.resolution; z++) {
                const index = (x) + (z) * this.resolution;

                vertices.push(new Vector3(x - halfResolution, this.heights[index], z - halfResolution));
                normals.push(Vector3.up);
                tangents.push(new Vector4(1, 0, 0, 1));
                uvs.push(new Vector2(x, z));
            }
        }

        this.mesh.vertices = vertices;
        this.mesh.normals = normals;
        this.mesh.tangents = tangents;
        this.mesh.uvs = uvs;

        let lod = 0;
        const triangles = [];
        const offset = Math.pow(2, lod);
        for (let x = 0; x + 1 < this.resolution; x += offset) {
            for (let z = 0; z + 1 < this.resolution; z += offset) {
                const index = (x) + (z) * this.resolution;
                const indexForward = (x) + (z + offset) * this.resolution;
                const indexRight = (x + offset) + (z) * this.resolution;
                const indexForwardRight = (x + offset) + (z + offset) * this.resolution;

                triangles.push(index);
                triangles.push(indexRight);
                triangles.push(indexForward);

                triangles.push(indexForward);
                triangles.push(indexRight);
                triangles.push(indexForwardRight);
            }
        }
        this.mesh.SetTriangles(triangles, lod);

        this.mesh.RecalculateNormals();
        // this.mesh.RecalculateTangents();
        this.mesh.RecalculateBounds();
        this.mesh.Update();
    }

    Render(renderPass) {
        if (!this.material || !this.mesh) return;

        if (renderPass.name === 'shadowRenderPass') {
            if (this.castShadows) {
                Graphics.DrawMesh(renderPass, this.mesh, this.transform.matrix4x4, this.material, 0, DirectionalLight.main.viewMatrix, DirectionalLight.main.projectionMatrix);
            }
        } else {
            Graphics.DrawMesh(renderPass, this.mesh, this.transform.matrix4x4, this.material, 0, Camera.main.viewMatrix, Camera.main.projectionMatrix);
        }
    }

}