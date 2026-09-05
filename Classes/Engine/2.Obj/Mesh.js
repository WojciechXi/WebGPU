class Mesh extends Obj {

    static _nextId = 0;

    constructor() {
        super();
        const object = this;

        object.id = Mesh._nextId++;
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
    }

    get bindposeCount() { } // The number of bind poses in the Mesh.
    get bindposes() { } // The bind poses. The bind pose at each index refers to the bone with the same index.
    get blendShapeCount() { } // Returns BlendShape count on this mesh.
    get boneWeights() { } // The BoneWeight for each vertex in the Mesh, which represents 4 bones per vertex.
    get colors() { } // Vertex colors of the Mesh.
    get colors32() { } // Vertex colors of the Mesh.
    get indexBufferTarget() { } // The intended target usage of the Mesh GPU index buffer.
    get indexFormat() { } // Format of the mesh index buffer data.
    get isReadable() { } // Returns true if the Mesh is read/write enabled, or false if it is not.
    get lodCount() { } // The number of LOD levels in this mesh.
    get lodSelectionCurve() { } // This struct represents the parameters that Unity uses to calculate which Mesh LOD level to select. It contains the lodBias and lodSlope properties, which scale logarithmically using screen space pixel area.
    get normals() { } // An array of vectors that defines the surface orientation at each vertex of the mesh.
    get skinWeightBufferLayout() { } // The dimension of data in the bone weight buffer.
    get subMeshCount() { return this.subMeshes.length; } set subMeshCount(value) { this.subMeshes = new Array(value); }
    get tangents() { return this.tangents; } // The tangents of the Mesh.
    get triangles() { } // An array containing all triangles in the Mesh.
    get uv() { return this.uvs; } // The texture coordinates (UVs) in the first channel.
    get vertexAttributeCount() { } // Returns the number of vertex attributes that the mesh has. (Read Only)
    get vertexBufferCount() { } // Gets the number of vertex buffers present in the Mesh. (Read Only)
    get vertexBufferTarget() { } // The intended target usage of the Mesh GPU vertex buffer.
    get vertexCount() { return this.vertices.length; } // Returns the number of vertices in the Mesh (Read Only).
    get vertices() { return this.vertices; } // Returns a copy of the vertex positions or assigns a new vertex positions array.

    AddBlendShapeFrame() { }
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
    ClearBlendShapes() { }
    CombineMeshes() { }
    GetAllBoneWeights() { }
    GetBaseVertex() { }
    GetBindposes() { }
    GetBlendShapeBuffer() { }
    GetBlendShapeBufferRange() { }
    GetBlendShapeFrameCount() { }
    GetBlendShapeFrameVertices() { }
    GetBlendShapeFrameWeight() { }
    GetBlendShapeIndex() { }
    GetBlendShapeName() { }
    GetBonesPerVertex() { }
    GetBoneWeightBuffer() { }
    GetBoneWeights() { }
    GetColors() { }
    GetIndexBuffer() { }
    GetIndexCount() { }
    GetIndexStart() { }
    GetIndices() { }
    GetLod() { }
    GetLods() { }
    GetNativeIndexBufferPtr() { }
    GetNativeVertexBufferPtr() { }
    GetNormals() { }
    GetSubMesh(subMeshIndex) { return this.subMeshes[subMeshIndex]; }
    GetTangents() { }
    GetTopology() { }
    GetTriangles() { }
    GetUVDistributionMetric() { }
    GetUVs() { }
    GetVertexAttribute() { }
    GetVertexAttributeDimension() { }
    GetVertexAttributeFormat() { }
    GetVertexAttributeOffset() { }
    GetVertexAttributes() { }
    GetVertexAttributeStream() { }
    GetVertexBuffer() { }
    GetVertexBufferStride() { }
    GetVertices() { }
    HasVertexAttribute() { }
    MarkDynamic() { }
    MarkModified() { }
    Optimize() { }
    OptimizeIndexBuffers() { }
    OptimizeReorderVertexBuffer() { }
    RecalculateBounds() { return this.bounds = GeometryUtility.CalculateBounds(this.vertices, Matrix4x4.Identity()); }
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
    RecalculateUVDistributionMetric() { }
    RecalculateUVDistributionMetrics() { }
    SetBindposes(matrices) { }
    SetBoneWeights(bonesPerVertex, weights) { }
    SetColors(inColors) { this.colors = inColors.map(c => c.Clone()); }
    SetIndexBufferData(data, dataStart, meshBufferStart, count, flags = 0) { }
    SetIndexBufferParams(indexCount, format) { }
    SetIndices(indices, topology, subMesh, calculateBounds = true, baseVertex = 0) { }
    SetLod(subMesh, level, levelRange, flags = 0) { }
    SetLods(levels, subMesh, flags) { }
    SetNormals(inNormals) { this.normals = inNormals.map(n => n.Clone()); }
    SetFlatNormals(inNormals, stride = 4) {
        this.normals = [];
        for (let i = 0; i < inNormals.length; i += stride) this.normals.push(new Vector3(inNormals[i], inNormals[i + 1], inNormals[i + 2]));
    }
    SetSubMesh(index, subMesh) { this.subMeshes[index] = subMesh; }
    SetSubMeshes(subMeshes) { this.subMeshes = subMeshes; }
    SetTangents(inTangents) { this.tangents = inTangents.map(t => t.Clone()); }
    SetFlatTangents(inTangents, stride = 4) {
        this.tangents = [];
        for (let i = 0; i < inTangents.length; i += stride) this.tangents.push(new Vector4(inTangents[i], inTangents[i + 1], inTangents[i + 2], inTangents[i + 3]));
    }
    SetTriangles(triangles, subMeshIndex, calculateBounds = true, baseVertex = 0) {
        this.subMeshes[subMeshIndex].SetTriangles(triangles, baseVertex);
        // if (calculateBounds) this.RecalculateBounds();
    }
    SetUVs(uvs) { this.uvs = uvs.map(u => u.Clone()); }
    SetFlatUvs(inUvs, stride = 4) {
        this.uvs = [];
        for (let i = 0; i < inUvs.length; i += stride) this.uvs.push(new Vector2(inUvs[i], inUvs[i + 1]));
    }
    SetVertexBufferData(data, dataStart, meshBufferStart, count, stream, flags = 0) { }
    SetVertexBufferParams(vertexCount, attributes) { }
    SetVertices(inVertices, calculateBounds = true) {
        this.vertices = inVertices.map(v => v.Clone());
        if (calculateBounds) this.RecalculateBounds();
    }
    SetFlatVertices(inVertices, stride = 4, calculateBounds = true) {
        this.vertices = [];
        for (let i = 0; i < inVertices.length; i += stride) this.vertices.push(new Vector3(inVertices[i], inVertices[i + 1], inVertices[i + 2]));
        if (calculateBounds) this.RecalculateBounds();
    }
    UploadMeshData() {
        let offset = 4 + 4 + 4 + 4 + 4 + 4 + 4; // position + normal + tangent + color + uv + joints + weights

        let vertices = new Float32Array(this.vertices.length * offset);
        let lines = new Float32Array(this.vertices.length * 4);

        for (let i = 0; i < this.vertices.length; i++) {
            let vertex = this.vertices[i] ?? Vector3.zero;
            let normal = this.normals[i] ?? Vector3.up;
            let tangent = this.tangents[i] ?? new Vector4(0, 0, 0, 1);
            let color = this.colors[i] ?? Color32.white;
            let uv = this.uvs[i] ?? Vector2.zero;
            let joints = this.joints[i] ?? new Vector4(-1, -1, -1, -1);
            let weights = this.weights[i] ?? new Vector4(0, 0, 0, 0);

            vertices.set([
                vertex.x, vertex.y, vertex.z, 0,
                normal.x, normal.y, normal.z, 0,
                tangent.x, tangent.y, tangent.z, tangent.w,
                color.r, color.g, color.b, color.a,
                uv.x, uv.y, 0, 0,
                joints.x, joints.y, joints.z, joints.w,
                weights.x, weights.y, weights.z, weights.w,
            ], i * offset);

            lines.set([
                vertex.x, vertex.y, vertex.z, 0,
            ], i * 4);
        }

        this.vertexBuffer.Resize(vertices.length);
        this.vertexBuffer.Set(vertices);

        this.lineBuffer.Resize(lines.length);
        this.lineBuffer.Set(lines);

        for (let subMesh of this.subMeshes) subMesh.UploadMeshData();
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