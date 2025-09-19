window.addEventListener('load', function (event) {
    let engine = new Engine();
    engine.scene = new Scene();

    engine.Init(function (engine) {
        let shader = new Shader(`
            struct Uniforms {
                viewProjectionMatrix: mat4x4f,
                matrix: mat4x4f,
                color: vec4f,
                lightDirection: vec3f,
            };

            struct Vertex {
                @location(0) position: vec4f,
                @location(1) normal: vec3f,
            };

            struct VSOutput {
                @builtin(position) position: vec4f,
                @location(0) normal: vec3f,
            };

            @group(0) @binding(0) var<uniform> uni: Uniforms;

            @vertex fn vs(vert: Vertex) -> VSOutput {
                var vsOut: VSOutput;
                vsOut.position = uni.viewProjectionMatrix * uni.matrix * vert.position;
                vsOut.normal = vert.normal;
                return vsOut;
            }

            @fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
                let normal = normalize(vsOut.normal);
                let light = dot(normal, -uni.lightDirection);
                let color = uni.color.rgb * light;
                return vec4f(color, uni.color.a);
            }
            `);

        shader.Compile();

        let material = new Material(shader);

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

        mesh.normals = [
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

        mesh.Update();

        let cubeGameObject = new GameObject('Cube');
        let meshRenderer = cubeGameObject.AddComponent(MeshRenderer);
        meshRenderer.mesh = mesh;
        meshRenderer.material = material;

        let cameraGameObject = new GameObject('Camera');
        cameraGameObject.transform.position.z = 5;
        cameraGameObject.transform.position.x = 5;
        let camera = cameraGameObject.AddComponent(Camera);
    });
});