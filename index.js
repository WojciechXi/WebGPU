function createFVertices() {
    const positions = [
        // left column
        -50, 75, 15,
        -20, 75, 15,
        -50, -75, 15,
        -20, -75, 15,

        // top rung
        -20, 75, 15,
        50, 75, 15,
        -20, 45, 15,
        50, 45, 15,

        // middle rung
        -20, 15, 15,
        20, 15, 15,
        -20, -15, 15,
        20, -15, 15,

        // left column back
        -50, 75, -15,
        -20, 75, -15,
        -50, -75, -15,
        -20, -75, -15,

        // top rung back
        -20, 75, -15,
        50, 75, -15,
        -20, 45, -15,
        50, 45, -15,

        // middle rung back
        -20, 15, -15,
        20, 15, -15,
        -20, -15, -15,
        20, -15, -15,
    ];

    const indices = [
        0, 2, 1, 2, 3, 1,   // left column
        4, 6, 5, 6, 7, 5,   // top run
        8, 10, 9, 10, 11, 9,   // middle run

        12, 13, 14, 14, 13, 15,   // left column back
        16, 17, 18, 18, 17, 19,   // top run back
        20, 21, 22, 22, 21, 23,   // middle run back

        0, 5, 12, 12, 5, 17,   // top
        5, 7, 17, 17, 7, 19,   // top rung right
        6, 18, 7, 18, 19, 7,   // top rung bottom
        6, 8, 18, 18, 8, 20,   // between top and middle rung
        8, 9, 20, 20, 9, 21,   // middle rung top
        9, 11, 21, 21, 11, 23,   // middle rung right
        10, 22, 11, 22, 23, 11,   // middle rung bottom
        10, 3, 22, 22, 3, 15,   // stem right
        2, 14, 3, 14, 15, 3,   // bottom
        0, 12, 2, 12, 14, 2,   // left
    ];


    const quadColors = [
        200, 70, 120,  // left column front
        200, 70, 120,  // top rung front
        200, 70, 120,  // middle rung front

        80, 70, 200,  // left column back
        80, 70, 200,  // top rung back
        80, 70, 200,  // middle rung back

        70, 200, 210,  // top
        160, 160, 220,  // top rung right
        90, 130, 110,  // top rung bottom
        200, 200, 70,  // between top and middle rung
        210, 100, 70,  // middle rung top
        210, 160, 70,  // middle rung right
        70, 180, 210,  // middle rung bottom
        100, 70, 210,  // stem right
        76, 210, 100,  // bottom
        140, 210, 80,  // left
    ];

    const numVertices = indices.length;
    const vertexData = new Float32Array(numVertices * 4); // xyz + color
    const colorData = new Uint8Array(vertexData.buffer);

    for (let i = 0; i < indices.length; ++i) {
        const positionNdx = indices[i] * 3;
        const position = positions.slice(positionNdx, positionNdx + 3);
        vertexData.set(position, i * 4);

        const quadNdx = (i / 6 | 0) * 3;
        const color = quadColors.slice(quadNdx, quadNdx + 3);
        colorData.set(color, i * 16 + 12);
        colorData[i * 16 + 15] = 255;
    }

    return {
        vertexData,
        numVertices,
    };
}

async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        fail('need a browser that supports WebGPU');
        return;
    }

    // Get a WebGPU context from the canvas and configure it
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('webgpu');
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
        alphaMode: 'premultiplied',
    });

    const module = device.createShaderModule({
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

    const pipeline = device.createRenderPipeline({
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

    const numFs = 5;
    const objectInfos = [];
    for (let i = 0; i < numFs; ++i) {
        // matrix
        const uniformBufferSize = (16) * 4;
        const uniformBuffer = device.createBuffer({
            label: 'uniforms',
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const uniformValues = new Float32Array(uniformBufferSize / 4);

        // offsets to the various uniform values in float32 indices
        const kMatrixOffset = 0;

        const matrixValue = uniformValues.subarray(kMatrixOffset, kMatrixOffset + 16);

        const bindGroup = device.createBindGroup({
            label: 'bind group for object',
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: uniformBuffer } },
            ],
        });

        objectInfos.push({
            uniformBuffer,
            uniformValues,
            matrixValue,
            bindGroup,
        });
    }

    const { vertexData, numVertices } = createFVertices();
    const vertexBuffer = device.createBuffer({
        label: 'vertex buffer vertices',
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertexData);

    const renderPassDescriptor = {
        label: 'our basic canvas renderPass',
        colorAttachments: [
            {
                // view: <- to be filled out when we render
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
        depthStencilAttachment: {
            // view: <- to be filled out when we render
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    const radius = 200;

    let depthTexture;

    let gameObject = new GameObject('Camera');
    let camera = gameObject.AddComponent(Camera);

    window.camera = camera;

    function render(time) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        camera.Update();
        camera.transform.Update();

        // Get the current texture from the canvas context and
        // set it as the texture to render to.
        const canvasTexture = context.getCurrentTexture();
        renderPassDescriptor.colorAttachments[0].view = canvasTexture.createView();

        // If we don't have a depth texture OR if its size is different
        // from the canvasTexture when make a new depth texture
        if (!depthTexture ||
            depthTexture.width !== canvasTexture.width ||
            depthTexture.height !== canvasTexture.height) {
            if (depthTexture) {
                depthTexture.destroy();
            }
            depthTexture = device.createTexture({
                size: [canvasTexture.width, canvasTexture.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
        }
        renderPassDescriptor.depthStencilAttachment.view = depthTexture.createView();

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        pass.setVertexBuffer(0, vertexBuffer);

        objectInfos.forEach(({
            matrixValue,
            uniformBuffer,
            uniformValues,
            bindGroup,
        }, i) => {
            const angle = i / numFs * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            Matrix4x4.Translate(camera.viewProjectionMatrix, [x, 0, z], matrixValue);

            // upload the uniform values to the uniform buffer
            device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

            pass.setBindGroup(0, bindGroup);
            pass.draw(numVertices);
        });

        pass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        requestAnimationFrame(function (time) {
            render(time);
        });
    }


    requestAnimationFrame(function (time) {
        render(time);
    });
}

function fail(msg) {
    alert(msg);
}

main();
