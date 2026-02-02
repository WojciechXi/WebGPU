class VoxelGPU extends MonoBehaviour {

    Init() {
        VoxelGPU.Instance = this;
        const voxelCount = (VoxelResolution + 1) ** 3;
        const bytesPerVoxel = 8;

        this.working = false;
        this.queue = [];

        let triTable = Resources.Get('/Resources/json/MarchingCubes.json');

        this.paramsBuffer = new GraphicsBuffer(GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 8, 4);
        this.voxelBuffer = new GraphicsBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC, voxelCount, 5 * 4);
        this.stagingBuffer = new GraphicsBuffer(GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ, voxelCount, 5 * 4);

        this.triTableBuffer = new GraphicsBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, triTable.triTable.length, 4, Int32Array);
        this.triTableBuffer.Set(triTable.triTable);

        const maxVertices = (VoxelResolution + 1) ** 3 * 15;

        this.verticesBuffer = new GraphicsBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC, maxVertices, 16 * 5);
        this.indicesBuffer = new GraphicsBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.INDEX, maxVertices, 4, Uint32Array);

        this.verticesStagingBuffer = new GraphicsBuffer(GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ, maxVertices, 16 * 5);

        this.counterBuffer = new GraphicsBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST, 1, 4, Uint32Array);
        this.counterStagingBuffer = new GraphicsBuffer(GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ, 1, 4, Uint32Array);

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

        this.colorPipeline = GPU.device.createComputePipeline({
            label: 'colorPipeline',
            layout: 'auto', // GPU samo dopasuje układ na podstawie shadera
            compute: {
                module: GPU.device.createShaderModule({
                    code: Resources.Get('/Resources/Compute/Color.wgsl') // Twoje źródło WGSL
                }),
                entryPoint: 'main',
            },
        });

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

        this.bindGroup = GPU.CreateBindGroup({
            label: 'bindGroup',
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: [
                this.paramsBuffer.GetBindGroupEntry(0),
                this.voxelBuffer.GetBindGroupEntry(1),
            ],
        });

        this.colorBindGroup = GPU.CreateBindGroup({
            label: 'bindGroup',
            layout: this.colorPipeline.getBindGroupLayout(0),
            entries: [
                this.voxelBuffer.GetBindGroupEntry(0),
            ],
        });
    }

    AddToQueue(voxelChunkComponent) {
        if (this.queue.indexOf(voxelChunkComponent) >= 0) return false;
        this.queue.push(voxelChunkComponent);
    }

    FixedUpdate() {
        if (this.working) return;

        let voxelChunkComponent = this.queue.shift();
        if (!voxelChunkComponent) return;

        this.working = true;
        this.Generate(voxelChunkComponent);
    }

    async Generate(voxelChunkComponent, seed = 6.62589278) {
        const position = voxelChunkComponent.transform.position;
        this.paramsBuffer.Set([position.x, position.y, position.z, 0, seed]);

        const commandEncoder = GPU.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();

        passEncoder.setPipeline(this.computePipeline);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.dispatchWorkgroups(Math.ceil(33 / 4), Math.ceil(33 / 4), Math.ceil(33 / 4));

        passEncoder.setPipeline(this.colorPipeline);
        passEncoder.setBindGroup(0, this.colorBindGroup);
        passEncoder.dispatchWorkgroups(Math.ceil(33 / 4), Math.ceil(33 / 4), Math.ceil(33 / 4));

        passEncoder.end();

        commandEncoder.copyBufferToBuffer(this.voxelBuffer.buffer, 0, this.stagingBuffer.buffer, 0, this.voxelBuffer.ByteLength);
        GPU.device.queue.submit([commandEncoder.finish()]);

        await this.stagingBuffer.MapAsync(GPUMapMode.READ);
        const copyArrayBuffer = this.stagingBuffer.GetMappedRange();
        const data = new DataView(copyArrayBuffer);

        for (let i = 0; i < (VoxelResolution + 1) ** 3; i++) {
            const offset = i * 8;
            const blockId = data.getUint32(offset, true);
            const iso = data.getFloat32(offset + 4, true);
            voxelChunkComponent.voxelChunk.voxels[i] = new Voxel(blockId, iso);
        }

        this.stagingBuffer.Unmap();

        this.GenerateMesh(voxelChunkComponent);
    }

    async GenerateMesh(voxelChunkComponent) {
        this.counterBuffer.Set([0]);

        const commandEncoder = GPU.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.meshPipeline);
        passEncoder.setBindGroup(0, this.meshBindGroup);
        passEncoder.dispatchWorkgroups(Math.ceil(33 / 4), Math.ceil(33 / 4), Math.ceil(33 / 4))
        passEncoder.end();
        commandEncoder.copyBufferToBuffer(this.counterBuffer.buffer, 0, this.counterStagingBuffer.buffer, 0, this.counterStagingBuffer.ByteLength);
        commandEncoder.copyBufferToBuffer(this.verticesBuffer.buffer, 0, this.verticesStagingBuffer.buffer, 0, this.verticesStagingBuffer.ByteLength);
        GPU.device.queue.submit([commandEncoder.finish()]);

        // 3. Pobranie liczby wierzchołków
        await this.counterStagingBuffer.MapAsync(GPUMapMode.READ);
        const numVertices = new Uint32Array(this.counterStagingBuffer.GetMappedRange())[0];
        this.counterStagingBuffer.Unmap();

        if (numVertices > 0) {
            await this.verticesStagingBuffer.MapAsync(GPUMapMode.READ);
            const rawData = this.verticesStagingBuffer.GetMappedRange(0, numVertices * 16 * 5);
            const floatData = new Float32Array(rawData.slice(0)); // .slice(0) kopiuje dane z pamięci GPU do JS

            this.verticesStagingBuffer.Unmap();

            const vertices = [];
            const normals = [];
            const uvs = [];
            const tangents = [];
            const colors = [];
            for (let i = 0; i < numVertices; i++) {
                const offset = i * 5 * 4;
                vertices.push(new Vector3(floatData[offset], floatData[offset + 1], floatData[offset + 2]));
                normals.push(new Vector3(floatData[offset + 4], floatData[offset + 5], floatData[offset + 6]));
                uvs.push(new Vector2(floatData[offset + 8], floatData[offset + 9]));
                tangents.push(new Vector4(floatData[offset + 12], floatData[offset + 13], floatData[offset + 14], floatData[offset + 15]));
                colors.push(new Color32(floatData[offset + 16], floatData[offset + 17], floatData[offset + 18], floatData[offset + 19]));
            }

            voxelChunkComponent.mesh.SetVertices(vertices);
            voxelChunkComponent.mesh.SetNormals(normals);
            voxelChunkComponent.mesh.SetUVs(uvs);
            voxelChunkComponent.mesh.SetTangents(tangents);
            voxelChunkComponent.mesh.SetColors(colors);

            // Jeśli potrzebujesz też indeksów 0..n:
            const indices = new Uint32Array(numVertices);
            for (let i = 0; i < numVertices; i++) indices[i] = i;
            voxelChunkComponent.mesh.SetTriangles(indices, 0);

            voxelChunkComponent.mesh.UploadMeshData();
        }

        this.working = false;
    }

}