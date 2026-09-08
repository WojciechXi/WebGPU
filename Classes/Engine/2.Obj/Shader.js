class Shader extends Obj {

    static {
        this.shaders = [];
    }

    static Find(name) {
        return this.shaders.find(s => s.name == name);
    }

    constructor() {
        super();
        Shader.shaders.push(this);

        new Property(this, 'renderPipelines', new Map());
        new Property(this, 'renderPipelineBuffers', []);

        new Property(this, 'shaderModule', null);

        new Property(this, 'renderQueue', 2000);
        new Property(this, 'code', '', {
            assigned: value => {
                let match = value ? value.match(/\/\/\s*name:\s*(.+)/i) : null;
                this.name = match ? match[1].trim() : `Shader_${this.instanceID}`;

                match = value ? value.match(/\/\/\s*renderQueue:\s*(.+)/i) : null;
                this.renderQueue = parseInt(match ? match[1].trim() : 2000);

                this.shaderModule = null;
            },
        });
    }

    Compile() {
        if (this.shaderModule) return;
        this.shaderModule = GPU.CreateShaderModule({ code: this.code, });
    }

    GetPipeline(renderPass, stateSettings = {}) {
        if (!this.shaderModule) this.Compile();

        const depthCompare = stateSettings.depthCompare || 'less';
        const cull = stateSettings.cull || 'back';
        const depthWrite = stateSettings.depthWrite ?? true;

        const stateKey = `${renderPass.name}_${depthCompare}_${cull}_${depthWrite}`;

        if (!this.renderPipelines.has(stateKey)) {
            const pipeline = this._createPipeline(renderPass, { cull: cull, depthCompare: depthCompare, depthWrite: depthWrite });
            this.renderPipelines.set(stateKey, pipeline);
        }

        return this.renderPipelines.get(stateKey);
    }

    _createPipeline(renderPass, states) {
        return GPU.CreateRenderPipeline({
            label: `${this.name}_${renderPass.name}_pipeline`,
            layout: GPU.CreatePipelineLayout({
                bindGroupLayouts: [
                    Graphics.viewBindGroupLayout,
                    Graphics.materialBindGroupLayout,
                    Graphics.pbrBindGroupLayout,
                    Graphics.jointsBindGroupLayout,
                ]
            }),
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs",
                buffers: [
                    {
                        arrayStride: 28 * 4, // 28 floats (pos + norm + tang + col + uv + joints + weights)
                        attributes: [
                            { shaderLocation: 0, offset: 0 * 4, format: 'float32x3' }, // position
                            { shaderLocation: 1, offset: 4 * 4, format: 'float32x3' }, // normal (poprawiony offset!)
                            { shaderLocation: 2, offset: 8 * 4, format: 'float32x4' }, // tangent
                            { shaderLocation: 3, offset: 12 * 4, format: 'float32x4' }, // color
                            { shaderLocation: 4, offset: 16 * 4, format: 'float32x2' }, // uv
                            { shaderLocation: 5, offset: 20 * 4, format: 'float32x4' }, // joints
                            { shaderLocation: 6, offset: 24 * 4, format: 'float32x4' }, // weights
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
                module: this.shaderModule,
                entryPoint: renderPass.name,
                targets: renderPass.GetTargets(),
            },
            primitive: {
                topology: "triangle-list",
                cullMode: states.cull,
                frontFace: 'cw',
            },
            depthStencil: {
                format: "depth24plus",
                depthWriteEnabled: states.depthWrite,
                depthCompare: states.depthCompare,
            }
        });
    }

}
