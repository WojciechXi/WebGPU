class Shader extends Obj {

    constructor(code, renderPipelineBuffers = null, settings = {}) {
        super();
        const object = this;

        object.code = code;
        object.shaderModule = null;
        // object.renderPipelines = new Map();

        object.pipeline = null;
        object.renderPipelines = [];
        object.renderPipelineBuffers = renderPipelineBuffers ?? [];
    }

    // GetPipeline(renderPassName, stateSettings = {}) {
    //     const stateKey = `${renderPassName}_${stateSettings.cull || 'back'}_${stateSettings.depthWrite ?? true}`;

    //     if (!this.pipelines.has(stateKey)) {
    //         this.pipelines.set(stateKey, this._createPipeline(renderPassName, stateSettings));
    //     }
    //     return this.pipelines.get(stateKey);
    // }

    // _createPipeline(passName, states) {
    //     const device = GPU.device;

    //     return device.createRenderPipeline({
    //         label: `${passName}_pipeline`,
    //         layout: GPU.CreatePipelineLayout({
    //             bindGroupLayouts: []
    //         }),
    //         vertex: {
    //             module: this.shaderModule,
    //             entryPoint: "vs",
    //             buffers: this._getVertexBufferLayout()
    //         },
    //         primitive: {
    //             topology: "triangle-list",
    //             cullMode: states.cull || 'back',
    //             frontFace: 'ccw',
    //         },
    //         depthStencil: {
    //             format: "depth24plus",
    //             depthWriteEnabled: states.depthWrite ?? true,
    //             depthCompare: states.depthCompare || "less",
    //         },
    //         fragment: {
    //             module: this.shaderModule,
    //             entryPoint: passName,
    //             targets: Graphics.getPassTargets(passName)
    //         }
    //     });
    // }

    // Compile() {
    //     this.shaderModule = GPU.CreateShaderModule({ code: object.code });
    // }

    Use(renderPass) {
        let renderPipeline = this.renderPipelines[renderPass.name];
        if (renderPipeline) {
            renderPass.SetPipeline(renderPipeline);
            return renderPipeline;
        }
        return null;
    }

    Compile() {
        const object = this;

        const device = GPU.device;
        const context = Graphics.context;

        // Tworzymy shader module
        object.shaderModule = GPU.CreateShaderModule({ code: object.code });

        if (object.code.indexOf('fn gBufferRenderPass') !== -1) {
            object.renderPipelines['gBufferRenderPass'] = GPU.CreateRenderPipeline({
                label: 'gBufferRenderPipeline',
                layout: GPU.CreatePipelineLayout({
                    bindGroupLayouts: [
                        Graphics.viewBindGroupLayout,
                        Graphics.materialBindGroupLayout,
                        Graphics.pbrBindGroupLayout,
                    ],
                }),
                vertex: {
                    module: object.shaderModule,
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
                        {
                            arrayStride: (16) * 4, // matrix4x4
                            stepMode: 'instance',
                            attributes: [
                                { shaderLocation: 5, offset: 0 * 4, format: 'float32x4' },
                                { shaderLocation: 6, offset: 4 * 4, format: 'float32x4' },
                                { shaderLocation: 7, offset: 8 * 4, format: 'float32x4' },
                                { shaderLocation: 8, offset: 12 * 4, format: 'float32x4' },
                            ],
                        },
                    ],
                },
                fragment: {
                    module: object.shaderModule,
                    entryPoint: "gBufferRenderPass",
                    targets: [
                        { format: "rgba16float" }, // viewPositionTexture
                        { format: "rgba8unorm" }, // viewNormalTexture

                        { format: "rgba16float" }, // colorTexture
                        { format: "rgba16float" }, // emissiveTexture
                        { format: "rgba8unorm" }, // pbrTexture
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
                    frontFace: 'ccw',
                },
            });
        }
    }

}
