class Mesh extends Obj {

    constructor(data = {}) {
        super(data);
        this.name = data.name ?? 'Mesh';

        this.bounds = new Bounds(Vector3.zero, Vector3.one);

        this.vertices = data.vertices ?? [];
        this.normals = data.normals ?? [];
        this.tangents = data.tangents ?? [];
        this.colors = data.colors ?? [];
        this.uvs = data.uvs ?? [];
        this.joints = data.joints ?? [];
        this.weights = data.weights ?? [];

        this.subMeshes = data.subMeshes ?? [];

        this.vertexBuffer = new Buffer(0, { usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
        this.lineBuffer = new Buffer(0, { usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });

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

        this.lineBuffer.Resize(0);
        this.vertexBuffer.Resize(0);

        for (let subMesh of this.subMeshes) subMesh.Clear();
        this.subMeshes = [];
    }

    Update() {
        let offset = 4 + 4 + 4 + 4 + 4; // position + normal + tangent + color + uv

        let vertices = new Float32Array(this.vertices.length * offset);
        let lines = new Float32Array(this.vertices.length * 4);

        for (let i = 0; i < this.vertices.length; i++) {
            let vertex = this.vertices[i] ?? Vector3.zero;
            let normal = this.normals[i] ?? Vector3.up;
            let tangent = this.tangents[i] ?? new Vector4(0, 0, 0, 1);
            let color = this.colors[i] ?? Color32.white;
            let uv = this.uvs[i] ?? Vector2.zero;

            vertices.set([
                vertex.x, vertex.y, vertex.z, 0,
                normal.x, normal.y, normal.z, 0,
                tangent.x, tangent.y, tangent.z, tangent.w,
                color.r, color.g, color.b, color.a,
                uv.x, uv.y, 0, 0
            ], i * offset);

            lines.set([
                vertex.x, vertex.y, vertex.z, 0,
            ], i * 4);
        }

        this.vertexBuffer.Resize(vertices.length);
        this.vertexBuffer.Set(vertices);

        this.lineBuffer.Resize(lines.length);
        this.lineBuffer.Set(lines);

        for (let subMesh of this.subMeshes) subMesh.Update();
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

        this.Update();
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

        this.Update();
    }

    RecalculateBounds() {
        return this.bounds = GeometryUtility.CalculateBounds(this.vertices, Matrix4x4.Identity());
    }

}

class SubMesh {

    constructor(data = {}) {
        this.material = data.material ?? null;

        this.triangles = new Uint32Array(data.triangles ?? 0);
        this.edges = new Uint32Array(data.edges ?? 0);

        this.triangleBuffer = new Buffer(0, { usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST }, Uint32Array);
        this.edgeBuffer = new Buffer(0, { usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST }, Uint32Array);
    }

    Clear() {
        this.triangles = new Uint32Array(0);
        this.edges = new Uint32Array(0);
        this.triangleBuffer.Resize(0);
        this.edgeBuffer.Resize(0);
    }

    Update() {
        this.triangleBuffer.Resize(this.triangles.length);
        this.triangleBuffer.Set(this.triangles);

        this.edgeBuffer.Resize(this.edges.length);
        this.edgeBuffer.Set(this.edges);
    }

}