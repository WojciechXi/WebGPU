class Shader extends Obj {

    constructor() {
        super();
        const object = this;

        new Property(object, 'renderQueue', 2000);
        new Property(object, 'code', code);
        new Property(object, 'shaderModule', null);

        new Property(object, 'renderPipelines', new Map());
        new Property(object, 'renderPipelineBuffers', []);
    }

    Compile() {
        const object = this;
        if (object.shaderModule) return;
        object.shaderModule = GPU.CreateShaderModule({ code: object.code, });
    }

    GetPipeline(renderPassName, stateSettings = {}) {
        const object = this;
        if (!object.shaderModule) object.Compile();

        const cull = stateSettings.cull || 'back';
        const depthWrite = stateSettings.depthWrite ?? true;
        const stateKey = `${renderPassName}_${cull}_${depthWrite}`;

        if (!object.renderPipelines.has(stateKey)) {
            const pipeline = this._createPipeline(renderPassName, { cull, depthWrite });
            object.renderPipelines.set(stateKey, pipeline);
        }

        return object.renderPipelines.get(stateKey);
    }

    Use(renderPass) {
        const object = this;

        let renderPipeline = object.renderPipelines[renderPass.name];
        if (!renderPipeline) return null;

        renderPass.SetPipeline(renderPipeline);
        return renderPipeline;
    }

    _createPipeline(passName, states) {
        const object = this;

        return GPU.CreateRenderPipeline({
            label: `${object._name}_${passName}_pipeline`,
            layout: GPU.CreatePipelineLayout({
                bindGroupLayouts: [
                    Graphics.viewBindGroupLayout,
                    Graphics.materialBindGroupLayout,
                    Graphics.pbrBindGroupLayout,
                    Graphics.jointsBindGroupLayout,
                ]
            }),
            vertex: {
                module: object.shaderModule,
                entryPoint: "vs",
                buffers: [
                    {
                        arrayStride: 28 * 4, // 28 floats (pos + norm + tang + col + uv + joints + weights)
                        attributes: [
                            { shaderLocation: 0, offset: 0 * 4, format: 'float32x3' }, // position
                            { shaderLocation: 1, offset: 3 * 4, format: 'float32x3' }, // normal (poprawiony offset!)
                            { shaderLocation: 2, offset: 6 * 4, format: 'float32x4' }, // tangent
                            { shaderLocation: 3, offset: 10 * 4, format: 'float32x4' }, // color
                            { shaderLocation: 4, offset: 14 * 4, format: 'float32x2' }, // uv
                            { shaderLocation: 5, offset: 16 * 4, format: 'float32x4' }, // joints
                            { shaderLocation: 6, offset: 20 * 4, format: 'float32x4' }, // weights
                        ],
                    },
                    {
                        arrayStride: 16 * 4, // Model Matrix (Instance)
                        stepMode: 'instance',
                        attributes: [
                            { shaderLocation: 7, offset: 0 * 4, format: 'float32x4' },
                            { shaderLocation: 8, offset: 4 * 4, format: 'float32x4' },
                            { shaderLocation: 9, offset: 8 * 4, format: 'float32x4' },
                            { shaderLocation: 10, offset: 12 * 4, format: 'float32x4' },
                        ],
                    },
                ]
            },
            fragment: {
                module: object.shaderModule,
                entryPoint: passName,
                targets: Graphics.getPassTargets(passName)
            },
            primitive: {
                topology: "triangle-list",
                cullMode: states.cull,
                frontFace: 'ccw',
            },
            depthStencil: {
                format: "depth24plus",
                depthWriteEnabled: states.depthWrite,
                depthCompare: "less"
            }
        });
    }

}
