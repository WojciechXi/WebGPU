class Graphics {

    constructor() {
        Graphics.Instance = this;
    }

    async Init(callback) {
        let adapter = this.adapter = await navigator.gpu?.requestAdapter();
        let device = this.device = await adapter?.requestDevice();

        if (!device) {
            fail('need a browser that supports WebGPU');
            return;
        }

        let canvas = this.canvas = document.querySelector('canvas');
        let context = this.context = canvas.getContext('webgpu');
        let presentationFormat = this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
            device,
            format: presentationFormat,
            alphaMode: 'premultiplied',
        });

        let module = this.module = device.createShaderModule({
            code: `
      struct Uniforms {
        matrix: mat4x4f,
      };

      struct Vertex {
        @location(0) position: vec4f,
        @location(1) color: vec4f,
      };

      struct VSOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      };

      @group(0) @binding(0) var<uniform> uni: Uniforms;

      @vertex fn vs(vert: Vertex) -> VSOutput {
        var vsOut: VSOutput;
        vsOut.position = uni.matrix * vert.position;
        vsOut.color = vert.color;
        return vsOut;
      }

      @fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
        return vsOut.color;
      }
    `,
        });

        let pipeline = this.pipeline = device.createRenderPipeline({
            label: '2 attributes',
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

        callback();
    }

}