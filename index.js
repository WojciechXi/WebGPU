function loadBitmap(src, callback) {
    const image = new Image();
    image.src = src;
    image.onload = async function (event) {
        const bitmap = await createImageBitmap(image);
        callback(bitmap, image);
    };
}

window.addEventListener('load', async function (event) {
    let device = await GPU.Request();
    if (!device) return alert('need a browser that supports WebGPU');

    Ajax.Get('/assets.php', function (response) {
        const assets = JSON.parse(response);

        const engine = new Engine(assets);
        engine.Init(function (engine) {
            const unlitShader = new Shader(assets.shaders['Unlit.wgsl'], [
                {
                    arrayStride: (3 + 3 + 3 + 2) * 4, // position + normal + color + uv
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x3' },       // position
                        { shaderLocation: 1, offset: 3 * 4, format: 'float32x3' },   // normal
                        { shaderLocation: 2, offset: 6 * 4, format: 'float32x3' },   // color
                        { shaderLocation: 3, offset: 9 * 4, format: 'float32x2' },   // uv
                    ],
                }
            ], {
                cullMode: 'none',
            });
            unlitShader.Compile();

            const whiteMaterial = new Material(unlitShader);
            const goldMaterial = new Material(unlitShader);
            goldMaterial.color.Set(1, 0.5, 0, 1);
            const blackMaterial = new Material(unlitShader);
            blackMaterial.color.Set(0, 0, 0, 1);
            const concreteMaterial = new Material(unlitShader);
            const floorMaterial = new Material(unlitShader);
            const u702pmst9Material = new Material(unlitShader);
            const u702st9Material = new Material(unlitShader);

            const sonomaMaterial = new Material(unlitShader);
            const unlit2Material = new Material(unlitShader);

            loadBitmap('/Assets/Images/U702 PMST9.jpg', function (bitmap) {
                u702pmst9Material.diffuse = bitmap;
            });

            loadBitmap('/Assets/Images/D1038 BS BETON MILLENIUM.jpg', function (bitmap) {
                concreteMaterial.diffuse = bitmap;
            });

            loadBitmap('/Assets/Images/WoodFloor057_1K-JPG_Color.jpg', function (bitmap) {
                floorMaterial.diffuse = bitmap;
            });

            loadBitmap('/Assets/Images/D3025 OW DAB SONOMA.jpg', function (bitmap) {
                sonomaMaterial.diffuse = bitmap;
            });

            loadBitmap('/Assets/Images/D4428_OV_Dąb_naturalny.jpg', function (bitmap) {
                unlit2Material.diffuse = bitmap;
            });

            const materials = {
                White: whiteMaterial,
                Concrete: concreteMaterial,
                Floor: floorMaterial,
                'H1386-ST40': sonomaMaterial,
                'U702-PM': u702pmst9Material,
                'U702-ST9': u702pmst9Material,
            };

            const ambientLight = engine.scene.AddComponent(AmbientLight);
            ambientLight.color.Set(0.95, 0.975, 1, 0.6);

            const directionalLightGameObject = new GameObject('DirectionalLight');
            directionalLightGameObject.transform.eulerAngles = new Vector3(-45, 0, 0);
            const directionalLight = directionalLightGameObject.AddComponent(DirectionalLight);

            const cameraGameObject = new GameObject('Camera');
            cameraGameObject.transform.position = new Vector3(-1, 1, 5);
            cameraGameObject.AddComponent(Camera);
            cameraGameObject.AddComponent(Test);

            Importer.Obj(assets.models['Krakow.obj'], function (meshes) {
                for (const mesh of meshes) {
                    const cubeGameObject = new GameObject('Cube');
                    const meshRenderer = cubeGameObject.AddComponent(MeshRenderer);
                    meshRenderer.material = materials[mesh.name] ?? whiteMaterial;
                    meshRenderer.mesh = mesh;
                }
            });

            console.clear();
        });
    });
});