class Shader {

    constructor(code, renderPipelineBuffers = null, settings = {}) {
        let _this = this;

        _this.code = code;
        _this.renderPipelineBuffers = renderPipelineBuffers ?? [];

        _this.settings = {
            layout: 'auto',
            cullMode: 'back',
            frontFace: 'ccw',
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
            blend: null,
        };

        Object.keys(settings).forEach(function (key) {
            _this.settings[key] = settings[key];
        });

        _this.module = null;
        _this.pipeline = null;
    }

    Compile() {
        const device = GPU.device;
        const context = Graphics.context;

        // Konfiguracja kontekstu
        const presentationFormat = this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
            device,
            format: presentationFormat,
            alphaMode: 'premultiplied',
        });

        // Tworzymy shader module
        this.module = device.createShaderModule({ code: this.code });

        // Tworzymy pipeline
        this.pipeline = device.createRenderPipeline({
            label: 'shader pipeline',
            layout: this.settings.layout,
            vertex: {
                module: this.module,
                entryPoint: 'vs',
                buffers: this.renderPipelineBuffers
            },
            fragment: {
                module: this.module,
                entryPoint: 'fs',
                targets: [
                    this.settings.blend ? {
                        format: presentationFormat,
                        blend: this.settings.blend,
                    } : {
                        format: presentationFormat,
                    }
                ],
            },
            primitive: {
                cullMode: this.settings.cullMode,
                frontFace: this.settings.frontFace,
            },
            depthStencil: {
                depthWriteEnabled: this.settings.depthWriteEnabled,
                depthCompare: this.settings.depthCompare,
                format: this.settings.format,
            },
        });
    }

}
