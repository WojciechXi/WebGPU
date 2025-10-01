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

        // Tworzymy shader module
        _this.shaderModule = GPU.CreateShaderModule({ code: _this.code });

        if (_this.code.indexOf('fn shadowRenderPass') !== -1) {
            _this.renderPipelines['shadowRenderPass'] = GPU.CreateRenderPipeline({
                layout: "auto",
                vertex: {
                    module: _this.shaderModule,
                    entryPoint: "vs",
                    buffers: [
                        {
                            arrayStride: (4 + 4 + 4 + 4 + 4) * 4, // position + normal + tangent + color + uv
                            attributes: [
                                { shaderLocation: 0, offset: 0 * 4, format: 'float32x3' }, // position
                                { shaderLocation: 1, offset: 4 * 4, format: 'float32x3' }, // normal
                                { shaderLocation: 2, offset: 8 * 4, format: 'float32x4' }, // tangent
                                { shaderLocation: 3, offset: 12 * 4, format: 'float32x4' }, // color
                                { shaderLocation: 4, offset: 16 * 4, format: 'float32x2' }, // uv
                            ],
                        },
                    ],
                },
                fragment: {
                    module: _this.shaderModule,
                    entryPoint: "shadowRenderPass",
                    targets: [
                        { format: "r32float" }, // depthTexture
                    ]
                },
                depthStencil: {
                    format: "depth24plus",
                    depthWriteEnabled: true,
                    depthCompare: "less"
                },
                primitive: {
                    topology: "triangle-list",
                    cullMode: 'back',
                    frontFace: 'cw',
                },
            });
        }

        if (_this.code.indexOf('fn gBufferRenderPass') !== -1) {
            _this.renderPipelines['gBufferRenderPass'] = GPU.CreateRenderPipeline({
                layout: "auto",
                vertex: {
                    module: _this.shaderModule,
                    entryPoint: "vs",
                    buffers: [
                        {
                            arrayStride: (4 + 4 + 4 + 4 + 4) * 4, // position + normal + tangent + color + uv
                            attributes: [
                                { shaderLocation: 0, offset: 0 * 4, format: 'float32x3' }, // position
                                { shaderLocation: 1, offset: 4 * 4, format: 'float32x3' }, // normal
                                { shaderLocation: 2, offset: 8 * 4, format: 'float32x4' }, // tangent
                                { shaderLocation: 3, offset: 12 * 4, format: 'float32x4' }, // color
                                { shaderLocation: 4, offset: 16 * 4, format: 'float32x2' }, // uv
                            ],
                        },
                    ],
                },
                fragment: {
                    module: _this.shaderModule,
                    entryPoint: "gBufferRenderPass",
                    targets: [
                        { format: "rgba16float" }, // viewPositionTexture
                        { format: "rgba8unorm" }, // viewNormalTexture

                        { format: "rgba16float" }, // colorTexture
                        { format: "rgba8unorm" }, // pbrTexture

                        { format: "r32float" }, // depthTexture
                    ]
                },
                depthStencil: {
                    format: "depth24plus",
                    depthWriteEnabled: true,
                    depthCompare: "less"
                },
                primitive: {
                    topology: "triangle-list",
                    cullMode: 'back',
                    frontFace: 'cw',
                },
            });
        }

        if (_this.code.indexOf('fn lightingRenderPass') !== -1) {

        }

        if (_this.code.indexOf('fn forwardRenderPass') !== -1) {

        }
    }

}
