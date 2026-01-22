class Terrain extends MonoBehaviour {

    Init() {
        this.size = new Vector3(100, 10, 100);
        this.resolution = 256;
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
        const size = Vector3.Scale(this.transform.lossyScale, this.size);
        return new Bounds(Vector3.Add(this.transform.position, Vector3.Multiply(size, 0.5)), size);
    }

    GetHeight(x, z) {
        let index = (x) + (z) * this.resolution;
        return this.heights[index];
    }

    GetHeightLinear(xLinear, zLinear) {
        const x = Mathf.floor(this.resolution * xLinear);
        const z = Mathf.floor(this.resolution * zLinear);

        const x1 = x + 1;
        const z1 = z + 1;

        if (x < 0 || z < 0 || x + 1 >= this.resolution || z + 1 >= this.resolution) return -Infinity;

        let lerpX = Mathf.InverseLerp(x, x1, this.resolution * xLinear);
        let lerpZ = Mathf.InverseLerp(z, z1, this.resolution * xLinear);

        const h00 = this.GetHeight(x, z);
        const h10 = this.GetHeight(x1, z);
        const h01 = this.GetHeight(x, z1);
        const h11 = this.GetHeight(x1, z1);

        const h0 = Mathf.Lerp(h00, h10, lerpX);
        const h1 = Mathf.Lerp(h01, h11, lerpX);

        return Mathf.Lerp(h0, h1, lerpZ);
    }

    GetObjectHeight(x, z) {
        return this.GetHeight(x, z) * this.size.y * this.transform.lossyScale.y;
    }

    GetObjectHeightLinear(xLinear, zLinear) {
        return this.GetHeightLinear(xLinear, zLinear) * this.size.y * this.transform.lossyScale.y;
    }

    GetWorldHeight(x, z) {
        return this.GetObjectHeigh(x, z) + this.transform.position.y;
    }

    GetWorldHeightLinear(xLinear, zLinear) {
        return this.GetObjectHeightLinear(xLinear, zLinear) + this.transform.position.y;
    }

    SampleHeight(position) {
        const bounds = this.bounds;

        const boundsMin = bounds.min;
        if (position.x < boundsMin.x) return 0;
        if (position.x < boundsMin.x) return 0;
        if (position.z < boundsMin.z) return 0;

        const boundsMax = bounds.max;
        if (position.x > boundsMax.x) return 0;
        if (position.x > boundsMax.x) return 0;
        if (position.z > boundsMax.z) return 0;

        const x = position.x - boundsMin.x;
        const z = position.z - boundsMin.z;

        const xLinear = x / (this.size.x * this.transform.lossyScale.x);
        const zLinear = z / (this.size.z * this.transform.lossyScale.z);

        return this.GetWorldHeightLinear(xLinear, zLinear);
    }

    SetHeights(x, z, width, height, heights) {
        for (let _x = 0; _x < width; _x++) {
            for (let _z = 0; _z < height; _z++) {
                let xx = x + _x;
                let zz = z + _z;
                let index = (xx) + (zz) * this.resolution;

                this.heights[index] = heights[_x + _z * width];
                this.mesh.vertices[index].y = heights[_x + _z * width];
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
                this.heights[index] = 0;

                vertices.push(new Vector3(x / (this.resolution - 1), this.heights[index], z / (this.resolution - 1)));
                normals.push(Vector3.up);
                tangents.push(new Vector4(1, 0, 0, 1));
                uvs.push(new Vector2(x / 4, z / 4));
            }
        }

        this.mesh.vertices = vertices;
        this.mesh.normals = normals;
        this.mesh.tangents = tangents;
        this.mesh.uvs = uvs;

        let lod = 0;
        const triangles = [];
        const offset = Mathf.Pow(2, lod);
        for (let x = 0; x + 1 < this.resolution; x += offset) {
            for (let z = 0; z + 1 < this.resolution; z += offset) {
                const index = (x) + (z) * this.resolution;
                const indexForward = (x) + (z + offset) * this.resolution;
                const indexRight = (x + offset) + (z) * this.resolution;
                const indexForwardRight = (x + offset) + (z + offset) * this.resolution;

                triangles.push(index);
                triangles.push(indexForward);
                triangles.push(indexRight);

                triangles.push(indexRight);
                triangles.push(indexForward);
                triangles.push(indexForwardRight);
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
            if (!this.castShadows) return;

            Graphics.DrawMesh(renderPass, this.mesh, this.gameObject.transformBindGroup, this.material, 0, DirectionalLight.main.viewMatrix, DirectionalLight.main.projectionMatrix);
        } else if (renderPass.name === 'gBufferRenderPass') {
            Graphics.DrawMesh(renderPass, this.mesh, this.gameObject.transformBindGroup, this.material, 0, Camera.main.viewMatrix, Camera.main.projectionMatrix);
        } else if (renderPass.name === 'gizmosRenderPass') {

        }
    }

}