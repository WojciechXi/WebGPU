class Terrain extends Component {

    Init() {
        this.size = new Vector3(100, 10, 100);
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
    }

    get bounds() {
        return new Bounds(this.transform.position, Vector3.Scale(this.transform.lossyScale, this.size));
    }

    GetHeight(xLinear, zLinear) {
        let x = Math.floor(this.resolution * xLinear);
        let z = Math.floor(this.resolution * zLinear);

        let index = (x) + (z) * this.resolution;

        return this.heights[index];
    }

    GetWorldHeight(xLinear, zLinear) {
        return this.GetHeight(xLinear, zLinear) + this.transform.position.y;
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

        this.mesh.RecalculateNormals();
        this.mesh.RecalculateTangents();
        this.mesh.RecalculateBounds();
        this.mesh.Update();
    }

    BuildMesh() {
        const vertices = [];
        const normals = [];
        const tangents = [];
        const uvs = [];

        for (let x = 0; x < this.resolution; x++) {
            for (let z = 0; z < this.resolution; z++) {
                const index = (x) + (z) * this.resolution;

                vertices.push(new Vector3(x / (this.resolution - 1), this.heights[index], z / (this.resolution - 1)));
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

                triangles.push(indexForwardRight);
                triangles.push(indexForward);
                triangles.push(indexRight);
            }
        }
        this.mesh.SetTriangles(triangles, lod);

        this.mesh.RecalculateNormals();
        this.mesh.RecalculateTangents();
        this.mesh.RecalculateBounds();
        this.mesh.Update();
    }

    Render(renderPass) {
        if (!this.material || !this.mesh) return;

        if (renderPass.name === 'shadowRenderPass') {
            if (this.castShadows) {
                const matrix4x4 = Matrix4x4.TRS(this.transform.position, this.transform.rotation, Vector3.Scale(this.transform.lossyScale, this.size));
                Graphics.DrawMesh(renderPass, this.mesh, matrix4x4, this.material, 0, DirectionalLight.main.viewMatrix, DirectionalLight.main.projectionMatrix);
            }
        } else {
            const matrix4x4 = Matrix4x4.TRS(this.transform.position, this.transform.rotation, Vector3.Scale(this.transform.lossyScale, this.size));
            Graphics.DrawMesh(renderPass, this.mesh, matrix4x4, this.material, 0, Camera.main.viewMatrix, Camera.main.projectionMatrix);
        }
    }

}