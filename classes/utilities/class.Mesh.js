class Mesh {

    constructor(data = {}) {
        this.name = data.name ?? 'Mesh';

        this.bounds = new Bounds(Vector3.zero, Vector3.zero);

        this.vertices = data.vertices ?? [];
        this.normals = data.normals ?? [];
        this.tangents = data.tangents ?? [];
        this.colors = data.colors ?? [];
        this.uvs = data.uvs ?? [];

        this.subMeshes = data.subMeshes ?? [];

        this.Update();
    }

    get subMeshCount() {
        return this.subMeshes.length;
    }

    get vertexCount() {
        return this.vertices.length;
    }

    SetTriangles(triangles, subMeshIndex) {
        this.subMeshes[subMeshIndex].triangles = new Uint32Array(triangles);
    }

    Clear() {
        this.vertices = [];
        this.normals = [];
        this.tangents = [];
        this.colors = [];
        this.uvs = [];

        if (this.vertexBuffer) this.vertexBuffer.destroy();
        this.vertexBuffer = GPU.CreateBuffer({
            size: 0,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        for (let subMesh of this.subMeshes) subMesh.Clear();
        this.subMeshes = [];
    }

    Update() {
        let offset = 4 + 4 + 4 + 4 + 4; // position + normal + tangent + color + uv
        let data = new Float32Array(this.vertices.length * offset);

        for (let i = 0; i < this.vertices.length; i++) {
            let vertex = this.vertices[i] ?? new Vector3(0, 0, 0);
            let normal = this.normals[i] ?? new Vector3(0, 0, 0);
            let tangent = this.tangents[i] ?? new Vector4(0, 0, 0, 1);
            let color = this.colors[i] ?? new Color(1, 1, 1);
            let uv = this.uvs[i] ?? new Vector2(0, 0);

            data.set([
                vertex.x, vertex.y, vertex.z, 0,
                normal.x, normal.y, normal.z, 0,
                tangent.x, tangent.y, tangent.z, tangent.w,
                color.r, color.g, color.b, color.a,
                uv.x, uv.y, 0, 0
            ], i * offset);
        }

        if (this.vertexBuffer) this.vertexBuffer.destroy();
        this.vertexBuffer = GPU.CreateBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        GPU.Queue.writeBuffer(this.vertexBuffer, 0, data);

        for (let subMesh of this.subMeshes) subMesh.Update();
    }

    Render(renderPass, subMeshIndex, mode = 'triangle') {
        renderPass.SetVertexBuffer(0, this.vertexBuffer);
        this.subMeshes[subMeshIndex].Render(renderPass, mode);
    }

    RecalculateNormals() {
        this.normals = Array(this.vertices.length).fill(0).map(() => new Vector3(0, 0, 0));

        for (let subMesh of this.subMeshes) {
            let tris = subMesh.triangles;
            for (let i = 0; i < tris.length; i += 3) {
                let i0 = tris[i], i1 = tris[i + 1], i2 = tris[i + 2];
                let v0 = this.vertices[i0];
                let v1 = this.vertices[i1];
                let v2 = this.vertices[i2];

                let e1 = Vector3.Subtract(v1, v0);
                let e2 = Vector3.Subtract(v2, v0);
                let n = e2.Cross(e1).normalized;

                this.normals[i0] = Vector3.Add(this.normals[i0], n);
                this.normals[i1] = Vector3.Add(this.normals[i1], n);
                this.normals[i2] = Vector3.Add(this.normals[i2], n);
            }
        }

        for (let i = 0; i < this.normals.length; i++) {
            this.normals[i] = this.normals[i].normalized;
        }
    }

    RecalculateTangents() {
        this.tangents = Array(this.vertices.length).fill(0).map(() => new Vector4(0, 0, 0, 1));
        let tan1 = Array(this.vertices.length).fill(0).map(() => new Vector3(0, 0, 0));
        let tan2 = Array(this.vertices.length).fill(0).map(() => new Vector3(0, 0, 0));

        for (let subMesh of this.subMeshes) {
            let tris = subMesh.triangles;
            for (let i = 0; i < tris.length; i += 3) {
                let i0 = tris[i], i1 = tris[i + 1], i2 = tris[i + 2];

                let v0 = this.vertices[i0];
                let v1 = this.vertices[i1];
                let v2 = this.vertices[i2];

                let uv0 = this.uvs[i0];
                let uv1 = this.uvs[i1];
                let uv2 = this.uvs[i2];

                let e1 = Vector3.Subtract(v1, v0);
                let e2 = Vector3.Subtract(v2, v0);

                let duv1 = Vector2.Subtract(uv1, uv0);
                let duv2 = Vector2.Subtract(uv2, uv0);

                let r = 1.0 / (duv1.x * duv2.y - duv1.y * duv2.x);

                let t = new Vector3(
                    (e1.x * duv2.y - e2.x * duv1.y) * r,
                    (e1.y * duv2.y - e2.y * duv1.y) * r,
                    (e1.z * duv2.y - e2.z * duv1.y) * r
                );

                let b = new Vector3(
                    (e2.x * duv1.x - e1.x * duv2.x) * r,
                    (e2.y * duv1.x - e1.y * duv2.x) * r,
                    (e2.z * duv1.x - e1.z * duv2.x) * r
                );

                tan1[i0] = Vector3.Add(tan1[i0], t);
                tan1[i1] = Vector3.Add(tan1[i1], t);
                tan1[i2] = Vector3.Add(tan1[i2], t);
                tan2[i0] = Vector3.Add(tan2[i0], b);
                tan2[i1] = Vector3.Add(tan2[i1], b);
                tan2[i2] = Vector3.Add(tan2[i2], b);
            }
        }

        for (let i = 0; i < this.vertices.length; i++) {
            let n = this.normals[i];
            let t = tan1[i];

            let tangent = (Vector3.Subtract(t, Vector3.Multiply(n, n.Dot(t)))).normalized;

            let handedness = (n.Cross(t).Dot(tan2[i]) < 0.0) ? -1.0 : 1.0;

            this.tangents[i] = new Vector4(tangent.x, tangent.y, tangent.z, handedness);
        }
    }


    RecalculateBounds() {
        if (this.vertices.length === 0) {
            this.bounds.Set(Vector3.zero, Vector3.zero);
            return;
        }

        let min = new Vector3(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY
        );

        let max = new Vector3(
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY
        );

        for (let v of this.vertices) {
            min = new Vector3(
                Math.min(min.x, v.x),
                Math.min(min.y, v.y),
                Math.min(min.z, v.z)
            );

            max = new Vector3(
                Math.max(max.x, v.x),
                Math.max(max.y, v.y),
                Math.max(max.z, v.z)
            );
        }

        let center = Vector3.Multiply(Vector3.Add(min, max), 0.5);
        let size = Vector3.Subtract(max, min);

        this.bounds = new Bounds(center, size);
    }

}

class SubMesh {

    constructor(data = {}) {
        this.material = data.material ?? null;

        this.triangles = new Uint32Array(data.triangles ?? 0);

        this.triangleBuffer = GPU.CreateBuffer({
            size: 0,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        this.edgeBuffer = GPU.CreateBuffer({
            size: 0,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
    }

    Clear() {
        this.triangles = new Uint32Array(0);

        if (this.triangleBuffer) this.triangleBuffer.destroy();
        this.triangleBuffer = GPU.CreateBuffer({
            size: 0,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        if (this.edgeBuffer) this.edgeBuffer.destroy();
        this.edgeBuffer = GPU.CreateBuffer({
            size: 0,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
    }

    Update() {
        if (this.triangleBuffer) this.triangleBuffer.destroy();
        this.triangleBuffer = GPU.CreateBuffer({
            size: this.triangles.length * 4,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        GPU.Queue.writeBuffer(this.triangleBuffer, 0, this.triangles);

        const edges = [];
        for (let i = 0; i < this.triangles.length; i += 3) {
            const a = this.triangles[i];
            const b = this.triangles[i + 1];
            const c = this.triangles[i + 2];
            edges.push(a, b, b, c, c, a);
        }
        this.edges = new Uint32Array(edges);

        if (this.edgeBuffer) this.edgeBuffer.destroy();
        this.edgeBuffer = GPU.CreateBuffer({
            size: this.edges.length * 4,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        GPU.Queue.writeBuffer(this.edgeBuffer, 0, this.edges);
    }

    Render(renderPass, mode = 'triangle') {
        if (mode == 'triangle') {
            renderPass.SetIndexBuffer(this.triangleBuffer, 'uint32');
            renderPass.DrawIndexed(this.triangles.length);
        } else if (mode == 'edge') {
            renderPass.SetIndexBuffer(this.edgeBuffer, 'uint32');
            renderPass.DrawIndexed(this.edges.length);
        }
    }

}