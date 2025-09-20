window.addEventListener('load', function (event) {
    let image = new Image();
    image.src = '/Assets/Images/D3025 OW DAB SONOMA.jpg';

    let engine = new Engine();
    engine.scene = new Scene();

    image.onload = async function (event) {
        let imageBitmap = await createImageBitmap(image);

        Ajax.Get('/Assets/Shaders/Shader.wgsl', function (shaderCode) {
            engine.Init(function (engine) {
                let shader = new Shader(shaderCode, [
                    {
                        arrayStride: (3 + 3 + 2) * 4, // position + normal + uv
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x3' },       // position
                            { shaderLocation: 1, offset: 3 * 4, format: 'float32x3' },   // normal
                            { shaderLocation: 2, offset: 6 * 4, format: 'float32x2' },   // uv
                        ],
                    }
                ]);

                shader.Compile(imageBitmap);

                let material = new Material(shader);

                let directionalLightGameObject = new GameObject('DirectionalLight');
                let directionalLight = directionalLightGameObject.AddComponent(DirectionalLight);

                let ambientLightGameObject = new GameObject('AmbientLight');
                let ambientLight = ambientLightGameObject.AddComponent(AmbientLight);
                ambientLight.color.a = 0.6;

                let cameraGameObject = new GameObject('Camera');
                cameraGameObject.transform.localPosition.y = 1;
                cameraGameObject.transform.localPosition.z = -2;
                let camera = cameraGameObject.AddComponent(Camera);

                Ajax.Get('/Assets/Models/Odlegla.obj', function (obj) {
                    Importer.Obj(obj, function (mesh) {
                        let cubeGameObject = new GameObject('Cube');
                        let meshRenderer = cubeGameObject.AddComponent(MeshRenderer);
                        cubeGameObject.AddComponent(Test);
                        meshRenderer.material = material;
                        meshRenderer.mesh = mesh;
                    });
                });
            });
        });
    }
});