async function loadBitmap(src, callback) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onerror = reject;
        image.onload = async function (event) {
            const bitmap = await createImageBitmap(image);
            resolve(bitmap);
            callback(bitmap, image);
        };
        image.src = src;
    })
}

window.addEventListener('DOMContentLoaded', async function (event) {
    const device = await GPU.Request();
    device.addEventListener('uncapturederror', (event) => {
        console.error('WebGPU Uncaptured Error:', event.error.message);
    });

    const engine = new Engine();
    const inspector = this.document.querySelector('#inspector');

    engine.Init(function (engine) {
        Gizmos.Init();
        window.engine = engine;
        Resources.Init(function () {
            engine.Start();

            Graphics.renderPipeline = new RenderPipeline();

            const litShader = new Shader();
            litShader.name = 'Lit';
            litShader.code = Resources.Get('/Resources/Shaders/Lit.wgsl');

            const defaultMaterial = Engine.defaultMaterial = new Material(litShader);

            const scene = new Scene();
            engine.scene = scene;

            const ambientLightGameObject = new GameObject("Ambient Light");
            const ambientLight = ambientLightGameObject.AddComponent(AmbientLight);
            scene.ambientLight = ambientLight;
            ambientLight.color.Set(0.8, 0.9, 1, 0.25);

            const directionalLightGameObject = new GameObject('Directional Light');
            directionalLightGameObject.transform.eulerAngles = new Vector3(60, -45, 0);
            const directionalLight = directionalLightGameObject.AddComponent(DirectionalLight);
            scene.directionalLight = directionalLight;
            directionalLight.color.Set(1, 1, 1, 0.75);
            directionalLightGameObject.transform.position = Vector3.Multiply(directionalLightGameObject.transform.back, 25);

            const mainCameraGameObject = new GameObject('Main Camera');
            mainCameraGameObject.transform.position = new Vector3(0, 0, 0);
            const mainCamera = mainCameraGameObject.AddComponent(Camera);

            for (let i = 0; i < 10; i++) {
                let t = (i / 10) * Mathf.PI;

                let cubeGameObject = new GameObject("Cube");
                cubeGameObject.transform.position = new Vector3(Mathf.Sin(t) * 10.0, 0, Mathf.Cos(t) * 10.0);
                let cubeMeshRenderer = cubeGameObject.AddComponent(MeshRenderer);
                cubeMeshRenderer.material = defaultMaterial;
                cubeMeshRenderer.sharedMesh = Gizmos.cubeMesh;
            }

            // Physics.simulate = true;
            inspector.innerHTML = ``;
        }, function (index, total, path) {
            inspector.innerHTML = `${index}/${total} - ${path}`;
        });
    });
});