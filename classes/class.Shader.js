class Shader {

    constructor(code, renderPipelineBuffers = null, settings = {}) {
        const _this = this;

        _this.code = code;
        _this.shaderModule = null;
        _this.pipeline = null;
        _this.renderPipelines = [];
        _this.renderPipelineBuffers = renderPipelineBuffers ?? [];
    }

    Use(renderPass) {
        let renderPipeline = this.renderPipelines[renderPass.name];
        if (renderPipeline) {
            renderPass.SetPipeline(renderPipeline);
            return renderPipeline;
        }
        return null;
    }

    Compile() {
        const _this = this;

        const device = GPU.device;
        const context = Graphics.context;

        // Konfiguracja kontekstu
        context.configure({
            device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'premultiplied',
        });

        // Tworzymy shader module
        _this.shaderModule = GPU.CreateShaderModule({ code: _this.code });

        if (_this.code.indexOf('fn gBufferRenderPass') !== -1) {
            _this.renderPipelines['gBufferRenderPass'] = GPU.CreateRenderPipeline({
                layout: "auto",
                vertex: {
                    module: _this.shaderModule,
                    entryPoint: "vs",
                    buffers: [
                        {
                            arrayStride: (3 + 3 + 3 + 2) * 4, // position + normal + color + uv
                            attributes: [
                                { shaderLocation: 0, offset: 0, format: 'float32x3' },       // position
                                { shaderLocation: 1, offset: 3 * 4, format: 'float32x3' },   // normal
                                { shaderLocation: 2, offset: 6 * 4, format: 'float32x3' },   // color
                                { shaderLocation: 3, offset: 9 * 4, format: 'float32x2' },   // uv
                            ],
                        },
                    ],
                },
                fragment: {
                    module: _this.shaderModule,
                    entryPoint: "gBufferRenderPass",
                    targets: [
                        { format: "rgba16float" }, // screenPositionTexture
                        { format: "rgba16float" }, // screenNormalTexture
                        { format: "rgba16float" }, // screenTangentTexture

                        { format: "rgba16float" }, // colorTexture
                        { format: "rgba16float" }, // normalTexture
                        { format: "rgba16float" }, // emisssionTexture
                        { format: "rgba16float" }, // pbrTexture

                        { format: "rgba16float" }, // depthTexture
                    ]
                },
                depthStencil: {
                    format: "depth24plus",
                    depthWriteEnabled: true,
                    depthCompare: "less"
                },
                primitive: {
                    cullMode: 'none',
                    frontFace: 'ccw',
                },
            });
        }

        if (_this.code.indexOf('fn shadowRenderPass') !== -1) {

        }

        if (_this.code.indexOf('fn lightingRenderPass') !== -1) {

        }

        if (_this.code.indexOf('fn forwardRenderPass') !== -1) {

        }
    }

}
