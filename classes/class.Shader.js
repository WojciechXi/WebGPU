class Shader {

    constructor(code) {
        this.code = code;
        this.module = null;
        this.pipeline = null;
    }

    Compile() {
        let context = Graphics.context;
        let device = Graphics.device;

        let presentationFormat = this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
            device,
            format: presentationFormat,
            alphaMode: 'premultiplied',
        });

        let module = this.module = this.module = Graphics.device.createShaderModule({
            code: this.code,
        });

        let pipeline = this.pipeline = this.pipeline = Graphics.device.createRenderPipeline({
            label: '2 attributes with color',
            layout: 'auto',
            vertex: {
                module,
                buffers: [
                    {
                        arrayStride: (3 + 3) * 4,
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x3' },  // position
                            { shaderLocation: 1, offset: 3 * 4, format: 'float32x3' },  // normal
                        ],
                    },
                ],
            },
            fragment: {
                module,
                targets: [{ format: presentationFormat }],
            },
            primitive: {
                cullMode: 'back',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            },
        });

        let viewProjectionMatrixSize = 16;
        let modelMatrixSize = 16;
        let colorSize = 4;
        let lightDirectionSize = 4;

        let totalSize = viewProjectionMatrixSize + modelMatrixSize + colorSize + lightDirectionSize;

        let uniformBufferSize = this.uniformBufferSize = totalSize * 4;
        let uniformBuffer = this.uniformBuffer = Graphics.device.createBuffer({
            label: 'uniforms',
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        let uniformValues = this.uniformValues = new Float32Array(totalSize);

        this.viewProjectionMatrix = uniformValues.subarray(0, 16);
        this.modelMatrix = uniformValues.subarray(16, 32);
        this.color = uniformValues.subarray(32, 36);
        this.lightDirection = uniformValues.subarray(36, 39);

        this.bindGroup = Graphics.device.createBindGroup({
            label: 'bind group for object',
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: uniformBuffer } },
            ],
        });
    }

    Use() {
        Graphics.pass.setPipeline(this.pipeline);
        Graphics.pass.setBindGroup(0, this.bindGroup);
        Graphics.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
    }

    SetViewProjectionMatrix(viewProjectionMatrix) {
        this.viewProjectionMatrix.set(viewProjectionMatrix);
    }

    SetModelMatrix(modelMatrix) {
        this.modelMatrix.set(modelMatrix);
    }

    SetColor(color) {
        this.color.set(color);
    }

    SetLightDirection(lightDirection) {
        this.lightDirection.set(lightDirection);
    }

}