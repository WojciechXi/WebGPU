window.addEventListener('load', function (event) {
    const image = new Image();
    image.src = '/Assets/Images/D3025 OW DAB SONOMA.jpg';

    const engine = new Engine();
    engine.scene = new Scene();

    image.onload = async function (event) {
        const imageBitmap = await createImageBitmap(image);

        Ajax.Get('/Assets/Shaders/Unlit.wgsl', function (shaderCode) {
            engine.Init(function (engine) {
                let unlitShader = new Shader(shaderCode, [
                    {
                        arrayStride: (3 + 3 + 3 + 2) * 4, // position + normal + color + uv
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x3' },       // position
                            { shaderLocation: 1, offset: 3 * 4, format: 'float32x3' },   // normal
                            { shaderLocation: 2, offset: 6 * 4, format: 'float32x3' },   // color
                            { shaderLocation: 3, offset: 9 * 4, format: 'float32x2' },   // uv
                        ],
                    }
                ]);

                unlitShader.Compile(imageBitmap);

                const unlitMaterial = new Material(unlitShader);

                const directionalLightGameObject = new GameObject('DirectionalLight');
                const directionalLight = directionalLightGameObject.AddComponent(DirectionalLight);

                const ambientLightGameObject = new GameObject('AmbientLight');
                const ambientLight = ambientLightGameObject.AddComponent(AmbientLight);
                ambientLight.color.a = 0.6;

                const cameraGameObject = new GameObject('Camera');
                cameraGameObject.AddComponent(Camera);
                cameraGameObject.AddComponent(Test);

                Ajax.Get('/Assets/Models/Odlegla.obj', function (obj) {
                    Importer.Obj(obj, function (meshes) {
                        for (const mesh of meshes) {
                            const cubeGameObject = new GameObject('Cube');
                            const meshRenderer = cubeGameObject.AddComponent(MeshRenderer);
                            meshRenderer.material = unlitMaterial;
                            meshRenderer.mesh = mesh;
                        }
                    });
                });
            });
        });
    }
});