class VoxelChunkComponent extends MonoBehaviour {

    constructor(data = {}, parameters = {}) {
        super(data, {
            ...parameters,
            voxelChunk: { value: new VoxelChunk(), },
            meshRenderer: { value: null, },
            mesh: { value: new Mesh(), set: false, },
        });

        const voxelCount = (VoxelResolution + 1) ** 3;
        const bytesPerVoxel = 8;

        let triTable = Resources.Get('/Resources/json/MarchingCubes.json');

        //Usage, Count, Stride

        this.paramsBuffer = new GraphicsBuffer(GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 8, 4);
        this.voxelBuffer = new GraphicsBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC, voxelCount, 8);
        this.stagingBuffer = new GraphicsBuffer(GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ, voxelCount, 8);

        this.triTableBuffer = new GraphicsBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, triTable.triTable.length, 4, Int32Array);
        this.triTableBuffer.Set(triTable.triTable);

        this.meshPipeline = GPU.device.createComputePipeline({
            label: 'meshPipeline',
            layout: 'auto',
            compute: {
                module: GPU.device.createShaderModule({
                    code: Resources.Get('/Resources/Compute/MarchingCubes.wgsl')
                }),
                entryPoint: 'marching_cubes',
            },
        });

        const maxVertices = (VoxelResolution + 1) ** 3 * 15;

        this.verticesBuffer = new GraphicsBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC, maxVertices, 32);
        this.indicesBuffer = new GraphicsBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.INDEX, maxVertices, 4, Uint32Array);

        this.verticesStagingBuffer = new GraphicsBuffer(GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ, maxVertices, 32);

        this.counterBuffer = new GraphicsBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST, 1, 4, Uint32Array);
        this.counterStagingBuffer = new GraphicsBuffer(GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ, 1, 4, Uint32Array);

        this.meshBindGroup = GPU.CreateBindGroup({
            label: 'meshBindGroup',
            layout: this.meshPipeline.getBindGroupLayout(0),
            entries: [
                this.voxelBuffer.GetBindGroupEntry(0),
                this.triTableBuffer.GetBindGroupEntry(1),
                this.verticesBuffer.GetBindGroupEntry(2),
                this.indicesBuffer.GetBindGroupEntry(3),
                this.counterBuffer.GetBindGroupEntry(4),
            ],
        });

        this.computePipeline = GPU.device.createComputePipeline({
            label: 'computePipeline',
            layout: 'auto', // GPU samo dopasuje układ na podstawie shadera
            compute: {
                module: GPU.device.createShaderModule({
                    code: Resources.Get('/Resources/Compute/Voxel.wgsl') // Twoje źródło WGSL
                }),
                entryPoint: 'main',
            },
        });

        this.bindGroup = GPU.CreateBindGroup({
            label: 'bindGroup',
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: [
                this.paramsBuffer.GetBindGroupEntry(0),
                this.voxelBuffer.GetBindGroupEntry(1),
            ],
        });
    }

    OnEnable() {
        this.meshRenderer = this.GetComponent(MeshRenderer);
        this.meshRenderer.mesh = this.mesh;
    }

    FixedUpdate() {

    }

    Generate(seed = 6.62589278) {
        const position = this.transform.position;
        this.paramsBuffer.Set([position.x, position.y, position.z, 0, seed]);

        const commandEncoder = GPU.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.computePipeline);
        passEncoder.setBindGroup(0, this.bindGroup); // Ten bindGroup używa paramsBuffer
        passEncoder.dispatchWorkgroups(4, 8, 8);
        passEncoder.end();
        commandEncoder.copyBufferToBuffer(this.voxelBuffer.buffer, 0, this.stagingBuffer.buffer, 0, this.voxelBuffer.ByteLength);
        GPU.device.queue.submit([commandEncoder.finish()]);

        this.readVoxels();
    }

    async readVoxels() {
        await this.stagingBuffer.MapAsync(GPUMapMode.READ);
        const copyArrayBuffer = this.stagingBuffer.GetMappedRange();
        const data = new DataView(copyArrayBuffer);

        for (let i = 0; i < (VoxelResolution + 1) ** 3; i++) {
            const offset = i * 8;
            const blockId = data.getUint32(offset, true);
            const iso = data.getFloat32(offset + 4, true);
            this.voxelChunk.voxels[i] = new Voxel(blockId, iso);
        }

        this.stagingBuffer.Unmap();

        this.GenerateMesh();
    }

    async GenerateMesh() {
        this.counterBuffer.Set([0]);

        const commandEncoder = GPU.device.createCommandEncoder();

        // 1. Obliczanie mesha
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.meshPipeline);
        passEncoder.setBindGroup(0, this.meshBindGroup);
        passEncoder.dispatchWorkgroups(4, 8, 8);
        passEncoder.end();

        // 2. Kopiowanie licznika i danych wierzchołków
        commandEncoder.copyBufferToBuffer(this.counterBuffer.buffer, 0, this.counterStagingBuffer.buffer, 0, this.counterStagingBuffer.ByteLength);

        // Kopiujemy tylko tyle, ile wynosi maxVertices (lub cały bufor)
        commandEncoder.copyBufferToBuffer(this.verticesBuffer.buffer, 0, this.verticesStagingBuffer.buffer, 0, this.verticesStagingBuffer.ByteLength);

        GPU.device.queue.submit([commandEncoder.finish()]);

        // 3. Pobranie liczby wierzchołków
        await this.counterStagingBuffer.MapAsync(GPUMapMode.READ);
        const numVertices = new Uint32Array(this.counterStagingBuffer.GetMappedRange())[0];
        this.counterStagingBuffer.Unmap();

        console.log(`Wygenerowano ${numVertices} wierzchołków.`);

        if (numVertices > 0) {
            await this.verticesStagingBuffer.MapAsync(GPUMapMode.READ);
            const rawData = this.verticesStagingBuffer.GetMappedRange(0, numVertices * 32);
            const floatData = new Float32Array(rawData.slice(0)); // .slice(0) kopiuje dane z pamięci GPU do JS

            this.verticesStagingBuffer.Unmap();

            const vertices = [];
            const normals = [];
            for (let i = 0; i < numVertices; i++) {
                const offset = i * 8;
                vertices.push(new Vector3(floatData[offset], floatData[offset + 1], floatData[offset + 2]));
                normals.push(new Vector3(floatData[offset + 4], floatData[offset + 5], floatData[offset + 6]));
            }

            this.mesh.SetVertices(vertices);
            this.mesh.SetNormals(normals);

            // Jeśli potrzebujesz też indeksów 0..n:
            const indices = new Uint32Array(numVertices);
            for (let i = 0; i < numVertices; i++) indices[i] = i;
            this.mesh.SetTriangles(indices, 0);

            this.mesh.UploadMeshData();
        }
    }

}