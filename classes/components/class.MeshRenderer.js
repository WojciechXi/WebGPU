class MeshRenderer extends Component {

    Init() {
        this.mesh = null;
        this.material = null;
    }

    Read() {
        let material = this.material;
        let shader = material.shader;

        // matrix and color
        let uniformBufferSize = this.uniformBufferSize = (16 + 4) * 4;
        let uniformBuffer = this.uniformBuffer = Graphics.device.createBuffer({
            label: 'uniforms',
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        let uniformValues = this.uniformValues = new Float32Array(uniformBufferSize / 4);

        // offsets to the various uniform values in float32 indices
        let kMatrixOffset = this.kMatrixOffset = 0;
        let kColorOffset = this.kColorOffset = 16;

        let matrixValue = this.matrixValue = uniformValues.subarray(kMatrixOffset, kMatrixOffset + 16);
        let colorValue = this.colorValue = uniformValues.subarray(kColorOffset, kColorOffset + 4);

        let bindGroup = this.bindGroup = Graphics.device.createBindGroup({
            label: 'bind group for object',
            layout: shader.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: uniformBuffer } },
            ],
        });

        let { vertexData, numVertices } = createCubeVertices();
        this.vertexData = vertexData;
        this.numVertices = numVertices;
        let vertexBuffer = this.vertexBuffer = Graphics.device.createBuffer({
            label: 'vertex buffer vertices',
            size: vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        Graphics.device.queue.writeBuffer(vertexBuffer, 0, vertexData);
    }

    Render() {
        if (!this.mesh || !this.material) return;

        let material = this.material;

        let pass = Graphics.pass;
        let vertexBuffer = this.vertexBuffer;
        let vertexData = this.vertexData;

        let matrixValue = this.matrixValue;
        let colorValue = this.colorValue;
        let uniformBuffer = this.uniformBuffer;
        let uniformValues = this.uniformValues;
        let bindGroup = this.bindGroup;
        let numVertices = this.numVertices;

        material.Use(pass);
        pass.setVertexBuffer(0, vertexBuffer);

        Matrix4x4.Translate(Camera.main.viewProjectionMatrix, this.transform.position, matrixValue);
        colorValue.set([1, 1, 1, 1]);

        Graphics.device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

        pass.setBindGroup(0, bindGroup);
        pass.draw(numVertices);
    }

}