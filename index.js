window.addEventListener('load', function (event) {
    let image = new Image();
    image.src = '/Assets/Images/frog.webp';

    let engine = new Engine();
    engine.scene = new Scene();

    image.onload = async function (event) {
        let imageBitmap = await createImageBitmap(image);

        Ajax.Get('/Assets/Shaders/Shader.wgsl', function (shaderCode) {
            engine.Init(function (engine) {

                let shader = new Shader(shaderCode);
                shader.Compile(imageBitmap);

                let material = new Material(shader);

                let cameraGameObject = new GameObject('Camera');
                cameraGameObject.transform.localPosition.y = 1;
                cameraGameObject.transform.localPosition.z = -2;
                let camera = cameraGameObject.AddComponent(Camera);

                Ajax.Get('/Assets/Models/Cube.obj', function (obj) {
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