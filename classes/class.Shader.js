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
                        arrayStride: (4) * 4, // (3) floats 4 bytes each + one 4 byte color
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x3' },  // position
                            { shaderLocation: 1, offset: 12, format: 'unorm8x4' },  // color
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
    }

    Use(pass) {
        pass.setPipeline(this.pipeline);
    }

}