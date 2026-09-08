class Mesh extends Obj {

    constructor() {
        super();
        const object = this;

        new Property(object, 'bounds', new Bounds(Vector3.zero, Vector3.zero));
        new Property(object, 'vertexBuffer', new Buffer(0, { usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST }));
        new Property(object, 'lineBuffer', new Buffer(0, { usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST }));
        new Property(object, 'vertices', []);
        new Property(object, 'normals', []);
        new Property(object, 'tangents', []);
        new Property(object, 'colors', []);
        new Property(object, 'uvs', []);
        new Property(object, 'joints', []);
        new Property(object, 'weights', []);
        new Property(object, 'subMeshes', []);

        new Property(object, 'subMeshCount', 0, {
            get: () => this.subMeshes.length,
            set: (value) => this.subMeshes.length = value,
        });
    }

    get bindposeCount() { return 0; }
    get bindposes() { return []; }
    get blendShapeCount() { return 0; }
    get boneWeights() { return this.weights; }
    get colors() { return this.colors; }
    get uv() { return this.uvs[0] ?? []; }
    get vertexCount() { return this.vertices.length; }

    Clear() {
        this.vertices = [];
        this.normals = [];
        this.tangents = [];
        this.colors = [];
        this.uvs = [];
        this.joints = [];
        this.weights = [];

        this.lineBuffer.Resize(0);
        this.vertexBuffer.Resize(0);

        for (let subMesh of this.subMeshes) subMesh.Clear();
        this.subMeshes = [];
    }

    GetSubMesh(subMeshIndex) { return this.subMeshes[subMeshIndex]; }

    RecalculateBounds() {
        return this.bounds = GeometryUtility.CalculateBounds(this.vertices, Matrix4x4.Identity());
    }

    RecalculateNormals() {
        const vCount = this.vertices.length;
        if (vCount === 0) return;

        const normBuffer = new Float32Array(vCount * 3);

        for (let subMesh of this.subMeshes) {
            const tris = subMesh.triangles;
            for (let i = 0; i < tris.length; i += 3) {
                // Uzwojenie CW w LH: v0 -> v1 -> v2
                const i0 = tris[i], i1 = tris[i + 1], i2 = tris[i + 2];

                const v0 = this.vertices[i0], v1 = this.vertices[i1], v2 = this.vertices[i2];

                const e1x = v1[0] - v0[0], e1y = v1[1] - v0[1], e1z = v1[2] - v0[2];
                const e2x = v2[0] - v0[0], e2y = v2[1] - v0[1], e2z = v2[2] - v0[2];

                // Iloczyn wektorowy w LH (Cross Product) dla krawędzi (v1-v0) x (v2-v0)
                let nx = e1y * e2z - e1z * e2y;
                let ny = e1z * e2x - e1x * e2z;
                let nz = e1x * e2y - e1y * e2x;

                normBuffer[i0 * 3] += nx; normBuffer[i0 * 3 + 1] += ny; normBuffer[i0 * 3 + 2] += nz;
                normBuffer[i1 * 3] += nx; normBuffer[i1 * 3 + 1] += ny; normBuffer[i1 * 3 + 2] += nz;
                normBuffer[i2 * 3] += nx; normBuffer[i2 * 3 + 1] += ny; normBuffer[i2 * 3 + 2] += nz;
            }
        }

        this.normals = new Array(vCount);
        for (let i = 0; i < vCount; i++) {
            const idx = i * 3;
            let nx = normBuffer[idx], ny = normBuffer[idx + 1], nz = normBuffer[idx + 2];
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

            if (len > 1e-8) {
                const invLen = 1.0 / len;
                nx *= invLen; ny *= invLen; nz *= invLen;
            } else {
                nx = 0; ny = 1; nz = 0;
            }
            this.normals[i] = new Vector3(nx, ny, nz);
        }
    }

    RecalculateTangents() {
        const vCount = this.vertices.length;
        if (vCount === 0) return;

        if (this.normals.length !== vCount) this.RecalculateNormals();

        const uvs = this.uv;
        if (!uvs || uvs.length !== vCount) return;

        const tan1 = new Float32Array(vCount * 3);
        const tan2 = new Float32Array(vCount * 3);

        for (let subMesh of this.subMeshes) {
            const tris = subMesh.triangles;
            for (let i = 0; i < tris.length; i += 3) {
                const i0 = tris[i], i1 = tris[i + 1], i2 = tris[i + 2];

                const v0 = this.vertices[i0], v1 = this.vertices[i1], v2 = this.vertices[i2];
                const uv0 = uvs[i0], uv1 = uvs[i1], uv2 = uvs[i2];

                const e1x = v1[0] - v0[0], e1y = v1[1] - v0[1], e1z = v1[2] - v0[2];
                const e2x = v2[0] - v0[0], e2y = v2[1] - v0[1], e2z = v2[2] - v0[2];

                const duv1x = uv1[0] - uv0[0], duv1y = uv1[1] - uv0[1];
                const duv2x = uv2[0] - uv0[0], duv2y = uv2[1] - uv0[1];

                const det = duv1x * duv2y - duv1y * duv2x;
                const r = Math.abs(det) < 1e-8 ? 0.0 : 1.0 / det;

                const tx = (e1x * duv2y - e2x * duv1y) * r;
                const ty = (e1y * duv2y - e2y * duv1y) * r;
                const tz = (e1z * duv2y - e2z * duv1y) * r;

                const bx = (e2x * duv1x - e1x * duv2x) * r;
                const by = (e2y * duv1x - e1y * duv2x) * r;
                const bz = (e2z * duv1x - e1z * duv2x) * r;

                tan1[i0 * 3] += tx; tan1[i0 * 3 + 1] += ty; tan1[i0 * 3 + 2] += tz;
                tan1[i1 * 3] += tx; tan1[i1 * 3 + 1] += ty; tan1[i1 * 3 + 2] += tz;
                tan1[i2 * 3] += tx; tan1[i2 * 3 + 1] += ty; tan1[i2 * 3 + 2] += tz;

                tan2[i0 * 3] += bx; tan2[i0 * 3 + 1] += by; tan2[i0 * 3 + 2] += bz;
                tan2[i1 * 3] += bx; tan2[i1 * 3 + 1] += by; tan2[i1 * 3 + 2] += bz;
                tan2[i2 * 3] += bx; tan2[i2 * 3 + 1] += by; tan2[i2 * 3 + 2] += bz;
            }
        }

        this.tangents = new Array(vCount);

        for (let i = 0; i < vCount; i++) {
            const idx = i * 3;
            const n = this.normals[i];
            const nx = n[0], ny = n[1], nz = n[2];

            const tx = tan1[idx], ty = tan1[idx + 1], tz = tan1[idx + 2];
            const bx = tan2[idx], by = tan2[idx + 1], bz = tan2[idx + 2];

            // Gram-Schmidt
            const dot = nx * tx + ny * ty + nz * tz;
            let ox = tx - nx * dot;
            let oy = ty - ny * dot;
            let oz = tz - nz * dot;

            let len = Math.sqrt(ox * ox + oy * oy + oz * oz);
            if (len > 1e-8) {
                const invLen = 1.0 / len;
                ox *= invLen; oy *= invLen; oz *= invLen;
            } else {
                ox = 1; oy = 0; oz = 0;
            }

            // W układzie LH iloczyn N x Tangent daje Bitangent kierujący się w stronę wzrostu UV.V
            const cx = ny * oz - nz * oy;
            const cy = nz * ox - nx * oz;
            const cz = nx * oy - ny * ox;

            // Skrętność (Handedness W) – dla DirectX LH przy odwrotnym V
            const handedness = (cx * bx + cy * by + cz * bz < 0.0) ? -1.0 : 1.0;

            this.tangents[i] = new Vector4(ox, oy, oz, handedness);
        }
    }

    SetColors(inColors) { this.colors = inColors.map(c => c.Clone()); }
    SetNormals(inNormals) { this.normals = inNormals.map(n => n.Clone()); }
    SetFlatNormals(inNormals, stride = 3) {
        this.normals = [];
        for (let i = 0; i < inNormals.length; i += stride) {
            this.normals.push(new Vector3(inNormals[i], inNormals[i + 1], inNormals[i + 2]));
        }
    }
    SetSubMesh(index, subMesh) { this.subMeshes[index] = subMesh; }
    SetSubMeshes(subMeshes) { this.subMeshes = subMeshes; }
    SetTangents(inTangents) { this.tangents = inTangents.map(t => t.Clone()); }
    SetFlatTangents(inTangents, stride = 4) {
        this.tangents = [];
        for (let i = 0; i < inTangents.length; i += stride) {
            this.tangents.push(new Vector4(inTangents[i], inTangents[i + 1], inTangents[i + 2], inTangents[i + 3]));
        }
    }
    SetTriangles(triangles, subMeshIndex, calculateBounds = true, baseVertex = 0) {
        this.subMeshes[subMeshIndex].SetTriangles(triangles, baseVertex);
        if (calculateBounds) this.RecalculateBounds();
    }
    SetUVs(uvs, index = 0) {
        if (!this.uvs[index]) this.uvs[index] = [];
        this.uvs[index] = uvs.map(u => u.Clone());
    }
    SetFlatUvs(inUvs, stride = 2, index = 0) {
        this.uvs[index] = [];
        for (let i = 0; i < inUvs.length; i += stride) {
            this.uvs[index].push(new Vector2(inUvs[i], inUvs[i + 1]));
        }
    }
    SetVertices(inVertices, calculateBounds = true) {
        this.vertices = inVertices.map(v => v.Clone());
        if (calculateBounds) this.RecalculateBounds();
    }
    SetFlatVertices(inVertices, stride = 3, calculateBounds = true) {
        this.vertices = [];
        for (let i = 0; i < inVertices.length; i += stride) {
            this.vertices.push(new Vector3(inVertices[i], inVertices[i + 1], inVertices[i + 2]));
        }
        if (calculateBounds) this.RecalculateBounds();
    }

    UploadMeshData() {
        const vCount = this.vertices.length;
        if (vCount === 0) return;

        const stride = 28;
        const verticesData = new Float32Array(vCount * stride);
        const linesData = new Float32Array(vCount * 4);

        const activeUv = this.uv;

        for (let i = 0; i < vCount; i++) {
            const v = this.vertices[i];
            const n = this.normals[i] ?? Vector3.up;
            const t = this.tangents[i] ?? [0, 0, 0, 1];
            const c = this.colors[i] ?? [1, 1, 1, 1];
            const uv = activeUv[i] ?? [0, 0];
            const j = this.joints[i] ?? [-1, -1, -1, -1];
            const w = this.weights[i] ?? [0, 0, 0, 0];

            const offset = i * stride;

            // Position
            verticesData[offset] = v[0];
            verticesData[offset + 1] = v[1];
            verticesData[offset + 2] = v[2];
            verticesData[offset + 3] = 1.0;

            // Normal
            verticesData[offset + 4] = n[0];
            verticesData[offset + 5] = n[1];
            verticesData[offset + 6] = n[2];
            verticesData[offset + 7] = 0.0;

            // Tangent
            verticesData[offset + 8] = t[0];
            verticesData[offset + 9] = t[1];
            verticesData[offset + 10] = t[2];
            verticesData[offset + 11] = t[3];

            // Color
            verticesData[offset + 12] = c[0];
            verticesData[offset + 13] = c[1];
            verticesData[offset + 14] = c[2];
            verticesData[offset + 15] = c[3];

            // UV
            verticesData[offset + 16] = uv[0];
            verticesData[offset + 17] = uv[1];
            verticesData[offset + 18] = 0.0;
            verticesData[offset + 19] = 0.0;

            // Joints
            verticesData[offset + 20] = j[0];
            verticesData[offset + 21] = j[1];
            verticesData[offset + 22] = j[2];
            verticesData[offset + 23] = j[3];

            // Weights
            verticesData[offset + 24] = w[0];
            verticesData[offset + 25] = w[1];
            verticesData[offset + 26] = w[2];
            verticesData[offset + 27] = w[3];

            // Line buffer
            const lineOffset = i * 4;
            linesData[lineOffset] = v[0];
            linesData[lineOffset + 1] = v[1];
            linesData[lineOffset + 2] = v[2];
            linesData[lineOffset + 3] = 1.0;
        }

        this.vertexBuffer.Resize(verticesData.length);
        this.vertexBuffer.Set(verticesData);

        this.lineBuffer.Resize(linesData.length);
        this.lineBuffer.Set(linesData);

        for (let subMesh of this.subMeshes) {
            subMesh.UploadMeshData();
        }
    }
}

class SubMesh {

    constructor(data = {}) {
        this.material = data.material ?? null;

        this.triangleBuffer = new GraphicsBuffer(GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST, 0, 4, Uint32Array);
        this.edgeBuffer = new GraphicsBuffer(GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST, 0, 4, Uint32Array);

        if (data.triangles) this.SetTriangles(data.triangles);
        if (data.edges) this.SetEdges(data.edges);
    }

    get triangles() { return this.triangleBuffer.values; }

    Clear() {
        this.triangleBuffer.Resize(0);
        this.edgeBuffer.Resize(0);
    }

    SetTriangles(triangles, baseVertex = 0, autoWriteBuffer = false) {
        this.triangleBuffer.Resize(triangles.length);
        this.triangleBuffer.Set(triangles, baseVertex, autoWriteBuffer);
    }

    SetEdges(edges, baseVertex = 0, autoWriteBuffer = false) {
        this.edgeBuffer.Resize(edges.length);
        this.edgeBuffer.Set(edges, baseVertex, autoWriteBuffer);
    }

    UploadMeshData() {
        this.triangleBuffer.WriteBuffer();
        this.edgeBuffer.WriteBuffer();
    }
}