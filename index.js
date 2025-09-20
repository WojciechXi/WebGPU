window.addEventListener('load', function (event) {
    let engine = new Engine();
    engine.scene = new Scene();
    Ajax.Get('/Assets/Shaders/Shader.wgsl', function (shaderCode) {
        engine.Init(function (engine) {
            let shader = new Shader(shaderCode);
            shader.Compile();

            let material = new Material(shader);

            let cameraGameObject = new GameObject('Camera');
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
});