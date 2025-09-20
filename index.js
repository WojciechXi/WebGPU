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
                vsOut.normal = (uni.viewProjectionMatrix * vec4f(vert.normal, 0)).xyz;
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

        let cameraGameObject = new GameObject('Camera');
        cameraGameObject.transform.localPosition.z = -2;
        let camera = cameraGameObject.AddComponent(Camera);

        Ajax.Get('/Cube.obj', function (response) {
            Importer.Obj(response, function (mesh) {
                let cubeGameObject = new GameObject('Cube');
                let meshRenderer = cubeGameObject.AddComponent(MeshRenderer);
                cubeGameObject.AddComponent(Test);
                meshRenderer.material = material;
                meshRenderer.mesh = mesh;
            });
        });
    });
});