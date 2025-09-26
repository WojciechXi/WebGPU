function loadBitmap(src, callback) {
    const image = new Image();
    image.src = src;
    image.onload = async function (event) {
        const bitmap = await createImageBitmap(image);
        callback(bitmap, image);
    };
}

window.addEventListener('load', async function (event) {
    // console.clear();

    let device = await GPU.Request();
    if (!device) return alert('need a browser that supports WebGPU');

    Ajax.Get('/assets.php', function (response) {
        const assets = window.assets = JSON.parse(response);

        const engine = new Engine(assets);
        engine.Init(function (engine) {
            const unlitShader = new Shader(assets.shaders['Unlit.wgsl']);
            unlitShader.Compile();

            const stackOfBricksMaterial = new Material(unlitShader);

            const whiteMaterial = new Material(unlitShader);
            const blackMaterial = new Material(unlitShader);
            blackMaterial.color.Set(0, 0, 0, 1);
            const goldMaterial = new Material(unlitShader);
            goldMaterial.color.Set(1, 0.5, 0, 1);
            const beigeMaterial = new Material(unlitShader);
            beigeMaterial.color.Set(223 / 255, 212 / 255, 200 / 255, 1);
            const oliveMaterial = new Material(unlitShader);
            oliveMaterial.color.Set(167 / 255, 169 / 255, 148 / 255, 1);

            const concreteMaterial = new Material(unlitShader);
            const floorMaterial = new Material(unlitShader);
            const u702pmst9Material = new Material(unlitShader);
            const u702st9Material = new Material(unlitShader);

            const sonomaMaterial = new Material(unlitShader);
            const unlit2Material = new Material(unlitShader);

            loadBitmap('/Assets/Images/Stack of Bricks/Albedo.jpg', function (bitmap) {
                stackOfBricksMaterial.albedo = bitmap;
                loadBitmap('/Assets/Images/Stack of Bricks/Normal.jpg', function (bitmap) {
                    stackOfBricksMaterial.normal = bitmap;
                    loadBitmap('/Assets/Images/Stack of Bricks/Occlusion.jpg', function (bitmap) {
                        stackOfBricksMaterial.ambientOcclusion = bitmap;
                    });
                });
            });

            loadBitmap('/Assets/Images/U702 PMST9.jpg', function (bitmap) {
                u702pmst9Material.albedo = bitmap;
            });

            loadBitmap('/Assets/Images/D1038 BS BETON MILLENIUM.jpg', function (bitmap) {
                concreteMaterial.albedo = bitmap;
            });

            loadBitmap('/Assets/Images/WoodFloor057_1K-JPG_Color.jpg', function (bitmap) {
                floorMaterial.albedo = bitmap;
            });

            loadBitmap('/Assets/Images/D3025 OW DAB SONOMA.jpg', function (bitmap) {
                sonomaMaterial.albedo = bitmap;
            });

            loadBitmap('/Assets/Images/D4428_OV_Dąb_naturalny.jpg', function (bitmap) {
                unlit2Material.albedo = bitmap;
            });

            const materials = {
                Glass: null,
                Stack_of_Bricks: stackOfBricksMaterial,

                White_Glossy: whiteMaterial,
                Plastic: whiteMaterial,

                White: whiteMaterial,
                Beige: beigeMaterial,
                Gold: goldMaterial,
                Black: blackMaterial,

                Concrete: concreteMaterial,
                Floor: floorMaterial,
                Tiles: floorMaterial,
                Walnut: sonomaMaterial,
                Wardrobe: sonomaMaterial,
                'H1386-ST40': sonomaMaterial,
                'U702-PM': u702pmst9Material,
                'U702-ST9': u702pmst9Material,

                Bedroom_S: oliveMaterial,
                Bedroom_E: oliveMaterial,
                Bedroom_N: oliveMaterial,
                Bedroom_W: oliveMaterial,

                Wall_S: oliveMaterial,
                Wall_E: oliveMaterial,
                Wall_N: oliveMaterial,
                Wall_W: oliveMaterial,

                Wall_K_S: oliveMaterial,
                Wall_K_S_2: oliveMaterial,
                Wall_K_S_3: oliveMaterial,
                Wall_K_S_4: oliveMaterial,
                Wall_K_W: oliveMaterial,
                Wall_K: oliveMaterial,
                Wall_K_2: oliveMaterial,
            };

            const ambientLight = engine.scene.AddComponent(AmbientLight);
            ambientLight.color.Set(0.95, 0.975, 1, 0.4);

            const directionalLightGameObject = new GameObject('DirectionalLight');
            directionalLightGameObject.transform.position = new Vector3(0, 15, 0);
            directionalLightGameObject.transform.rotation = Quaternion.FromEuler(-90, 0, 0);
            const directionalLight = directionalLightGameObject.AddComponent(DirectionalLight);

            const cameraGameObject = new GameObject('Camera');
            cameraGameObject.transform.position = new Vector3(-1, 1, 5);
            cameraGameObject.AddComponent(Camera);
            cameraGameObject.AddComponent(Test);

            Importer.GLTF('/Assets/Models', 'Stack of Bricks.gltf', function (meshes) {
                let index = 0;
                for (const mesh of meshes) {
                    const gameObject = new GameObject(mesh.name);
                    const meshRenderer = gameObject.AddComponent(MeshRenderer);
                    meshRenderer.transform.position = new Vector3(0, index, 0);
                    meshRenderer.transform.rotation = Quaternion.FromEuler(0, 0, 0);
                    meshRenderer.mesh = mesh;
                    meshRenderer.material = Object(materials).hasOwnProperty(mesh.name) ? materials[mesh.name] : stackOfBricksMaterial;
                    if (Object.keys(materials).indexOf(mesh.name) === -1) console.log(mesh.name);
                    index++;
                }
            });
        });
    });
});