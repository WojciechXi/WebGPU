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
    const engine = new Engine();

    engine.Init(function (engine) {
        Resources.Init(function () {
            engine.Awake();
            engine.Start();

            const litShader = new Shader(Resources.Get('/Resources/Shaders/Lit.wgsl'));
            litShader.Compile();

            const glassShader = new Shader(Resources.Get('/Resources/Shaders/Glass.wgsl'));
            glassShader.Compile();

            let materials = {};

            engine.defaultMaterial = materials.Default = new Material({
                name: 'Default',
                color: Color32.white,
                shader: litShader,
            });

            materials.Emissive = new Material({
                name: 'Emissive',
                color: Color32.red,
                emissive: new Color32(10, 0, 0),
                shader: litShader,
            });

            materials.Glass = new Material({
                name: 'Glass',
                color: Color32.red,
                shader: glassShader,
            });

            const ambientLightGameObject = new GameObject("Ambient Light");
            const ambientLight = ambientLightGameObject.AddComponent(AmbientLight);
            engine.scene.ambientLight = ambientLight;
            ambientLight.color.Set(0.8, 0.9, 1, 0.25);

            const directionalLightGameObject = new GameObject('Directional Light');
            directionalLightGameObject.transform.eulerAngles = new Vector3(60, -45, 0);
            const directionalLight = directionalLightGameObject.AddComponent(DirectionalLight);
            engine.scene.directionalLight = directionalLight;
            directionalLight.color.Set(1, 1, 1, 0.75);
            directionalLightGameObject.transform.position = Vector3.Multiply(directionalLightGameObject.transform.back, 25);

            const mainCameraGameObject = new GameObject('Main Camera');
            mainCameraGameObject.transform.position = new Vector3(0, 1, -2);
            const mainCamera = mainCameraGameObject.AddComponent(Camera);
            const test = mainCameraGameObject.AddComponent(Test);

            for (let x = 0; x < 8; x++) {
                for (let z = 0; z < 8; z++) {
                    let gameObject = new GameObject("Voxel Chunk");
                    gameObject.transform.position = new Vector3(x * 16, 0, z * 16);
                    let meshRenderer = gameObject.AddComponent(MeshRenderer);
                    let voxelChunkComponent = gameObject.AddComponent(VoxelChunkComponent);
                    voxelChunkComponent.Generate();
                }
            }

            // const cameraGameObject = new GameObject('Test Camera');
            // cameraGameObject.transform.position = new Vector3(-1, 1, -5);
            // const camera = cameraGameObject.AddComponent(Camera);
            // camera.rect.x = 0.75;
            // camera.rect.y = 0.75;
            // camera.rect.width = 0.25;
            // camera.rect.height = 0.25;

            // const planeGameObject = new GameObject("Plane");
            // const planeMeshRenderer = planeGameObject.AddComponent(MeshRenderer);
            // const planeBoxCollider = planeGameObject.AddComponent(BoxCollider);
            // planeGameObject.transform.localScale = new Vector3(10, 1, 10);
            // planeMeshRenderer.material = materials.Default;
            // planeMeshRenderer.mesh = Graphics.cubeMesh;

            // const sphereGameObject = new GameObject("Sphere");
            // sphereGameObject.transform.position = new Vector3(2, 2, 0);
            // const sphereMeshRenderer = sphereGameObject.AddComponent(MeshRenderer);
            // const sphereSphereCollider = sphereGameObject.AddComponent(SphereCollider);
            // const sphereRigidbody = sphereGameObject.AddComponent(Rigidbody);
            // sphereMeshRenderer.material = materials.Default;
            // sphereMeshRenderer.mesh = Graphics.sphereMesh;

            // const cubeGameObject = new GameObject("Cube");
            // cubeGameObject.transform.position = new Vector3(4, 2, 0);
            // const cubeMeshRenderer = cubeGameObject.AddComponent(MeshRenderer);
            // const cubeBoxCollider = cubeGameObject.AddComponent(BoxCollider);
            // const cubeRigidbody = cubeGameObject.AddComponent(Rigidbody);
            // cubeMeshRenderer.material = materials.Default;
            // cubeMeshRenderer.mesh = Graphics.cubeMesh;

            // const capsuleGameObject = new GameObject("Capsule");
            // capsuleGameObject.transform.position = new Vector3(-2, 2, 0);
            // const capsuleMeshRenderer = capsuleGameObject.AddComponent(MeshRenderer);
            // const capsuleCapsuleCollider = capsuleGameObject.AddComponent(CapsuleCollider);
            // const capsuleRigidbody = capsuleGameObject.AddComponent(Rigidbody);
            // capsuleMeshRenderer.material = materials.Default;
            // capsuleMeshRenderer.mesh = Graphics.cubeMesh;

            // Resources.Get('/Resources/Models/Human.glb', function (asset) {
            //     const gameObject = GameObject.Instantiate(asset.gameObject, Vector3.up.Multiply(0.5));
            //     const skinnedMeshRenderer = gameObject.GetComponent(SkinnedMeshRenderer);
            //     // const capsuleCollider = gameObject.AddComponent(CapsuleCollider);
            //     // gameObject.AddComponent(Rigidbody);
            //     // gameObject.AddComponent(PlayerController);
            // });

            Physics.simulate = true;
        }, function (index, total, path) {
            console.log(`${index}/${total} - ${path}`);
        });
    });
});