function createCubeVertices() {
    const positions = [
        // left
        0, 0, 0,
        0, 0, -1,
        0, 1, 0,
        0, 1, -1,

        // right
        1, 0, 0,
        1, 0, -1,
        1, 1, 0,
        1, 1, -1,
    ];

    const indices = [
        0, 2, 1, 2, 3, 1,   // left
        4, 5, 6, 6, 5, 7,   // right
        0, 4, 2, 2, 4, 6,   // front
        1, 3, 5, 5, 3, 7,   // back
        0, 1, 4, 4, 1, 5,   // bottom
        2, 6, 3, 3, 6, 7,   // top
    ];

    const quadColors = [
        200, 70, 120,  // left column front
        80, 70, 200,  // left column back
        70, 200, 210,  // top
        160, 160, 220,  // top rung right
        90, 130, 110,  // top rung bottom
        200, 200, 70,  // between top and middle rung
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

function fail(msg) {
    alert(msg);
}

window.addEventListener('load', function (event) {
    let engine = new Engine();
    engine.scene = new Scene();

    engine.Init(function (engine) {
        let shader = new Shader(`
            struct Uniforms {
                matrix: mat4x4f,
                color: vec4f,
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
                return vsOut.color * uni.color;
            }
            `);

        shader.Compile(engine.graphics);

        let material = new Material(shader);

        material.Init(engine.graphics);

        let mesh = new Mesh();
        mesh.vertices = [
            new Vector3(0, 0, 0),
            new Vector3(0, 0, -1),
            new Vector3(0, 1, 0),
            new Vector3(0, 1, -1),

            new Vector3(1, 0, 0),
            new Vector3(1, 0, -1),
            new Vector3(1, 1, 0),
            new Vector3(1, 1, -1),
        ];

        mesh.triangles = [
            0, 2, 1, 2, 3, 1,   // left
            4, 5, 6, 6, 5, 7,   // right
            0, 4, 2, 2, 4, 6,   // front
            1, 3, 5, 5, 3, 7,   // back
            0, 1, 4, 4, 1, 5,   // bottom
            2, 6, 3, 3, 6, 7,   // top
        ];

        mesh.colors = [
            new Color(200 / 255, 70 / 255, 120 / 255),
            new Color(80 / 255, 70 / 255, 200 / 255),
            new Color(70 / 255, 200 / 255, 210 / 255),
            new Color(160 / 255, 160 / 255, 220 / 255),
            new Color(90 / 255, 130 / 255, 110 / 255),
            new Color(200 / 255, 200 / 255, 70 / 255),
        ];

        mesh.Update();

        let cubeGameObject = new GameObject('Cube');
        let meshRenderer = cubeGameObject.AddComponent(MeshRenderer);
        let test = cubeGameObject.AddComponent(Test);
        meshRenderer.mesh = mesh;
        meshRenderer.material = material;
        meshRenderer.Read(engine.graphics);

        let cameraGameObject = new GameObject('Camera');
        cameraGameObject.transform.position.z = 10;
        let camera = cameraGameObject.AddComponent(Camera);
    });
});