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
    const hierarchy = window.hierarchy = this.document.querySelector('#hierarchy');
    const inspector = window.inspector = this.document.querySelector('#inspector');

    await engine.Init(async function (engine) {
        Gizmos.Init();
        window.engine = engine;
        engine.Start();

        const litShader = new Shader();
        litShader.name = 'Lit';
        litShader.code = await Resources.Load('Shaders/Lit.wgsl');

        const litNormalShader = new Shader();
        litNormalShader.name = 'LitNormal';
        litNormalShader.code = await Resources.Load('Shaders/LitNormal.wgsl');

        Engine.emptyMaterial = new Material(litShader);
        Engine.emptyMaterial.color = new Color32(1, 0.5, 0.25, 1.0);

        const renderPipeline = engine.renderPipeline = new RenderPipeline();
        await renderPipeline.Init();

        const allMaterials = {};
        const materialList = await Resources.Load('Materials.json');
        const materialKeys = Object.keys(materialList);
        for (let materialKey of materialKeys) {
            const materialDefinition = materialList[materialKey];
            const material = new Material(litShader);
            if (materialDefinition.color) material.color = Color32.FromArray(materialDefinition.color);
            for (let textureName of Object.keys(materialDefinition.textures ?? {})) {
                const texture = await Resources.Load(materialDefinition.textures[textureName]);
                material.SetTexture(textureName, texture);
            }
            material.Update();
            allMaterials[materialKey] = material;
        }

        const defaultMaterial = new Material(litShader);
        const defaultMaterialAlbedo = await Resources.Load('Textures/Floor/512_Albedo.webp');
        const defaultMaterialNormal = await Resources.Load('Textures/Floor/512_Normal.webp');
        const defaultMaterialPBR = await Resources.Load('Textures/Floor/512_PBR.webp');
        defaultMaterial.SetTexture('albedo', defaultMaterialAlbedo);
        defaultMaterial.SetTexture('normal', defaultMaterialNormal);
        defaultMaterial.SetTexture('pbr', defaultMaterialPBR);
        defaultMaterial.Update();

        const scene = new Scene();
        engine.scene = scene;

        const ambientLightGameObject = new GameObject("Ambient Light");
        const ambientLight = ambientLightGameObject.AddComponent(AmbientLight);
        scene.ambientLight = ambientLight;
        ambientLight.color.Set(0.98, 0.99, 1, 0.25);

        const directionalLightGameObject = new GameObject('Directional Light');
        directionalLightGameObject.transform.eulerAngles = new Vector3(60, -45, 0);
        const directionalLight = directionalLightGameObject.AddComponent(DirectionalLight);
        scene.directionalLight = directionalLight;
        directionalLight.color.Set(1, 1, 1, 0.75);
        directionalLightGameObject.transform.position = Vector3.Multiply(directionalLightGameObject.transform.back, 25);

        const mainCameraGameObject = new GameObject('Main Camera');
        mainCameraGameObject.transform.eulerAngles = new Vector3(0, 180, 0);
        mainCameraGameObject.transform.localPosition.y = 0.5;
        mainCameraGameObject.transform.localPosition.z = 2;
        // mainCameraGameObject.transform.localEulerAngles = new Vector3(0, 45, 0);
        const mainCamera = mainCameraGameObject.AddComponent(Camera);
        // const autoRotator = mainCameraGameObject.AddComponent(AutoRotator);
        // const freeCamera = mainCameraGameObject.AddComponent(FreeCamera);

        // const gameObject = new GameObject("Furniture");
        // const furniture = gameObject.AddComponent(Furniture);
        // furniture.material = allMaterials['D3025_OW_DĄB_SONOMA'];
        // console.log(furniture.rootNode.Split('x', 0.5)[0].Split('y', 0.5));
        // furniture.Build();
        const gltfObject = await Resources.Load('Models/Ablewicza 15.gltf');
        if (gltfObject && gltfObject.meshes) {
            const gameObject = new GameObject("Cube");
            const autoRotator = gameObject.AddComponent(AutoRotator);
            for (let mesh of gltfObject.meshes) {
                const childGameObject = new GameObject(mesh.name);
                childGameObject.transform.SetParent(gameObject.transform);
                let meshRenderer = childGameObject.AddComponent(MeshRenderer);
                meshRenderer.sharedMesh = mesh;

                const materials = [];
                for (let i = 0; i < mesh.subMeshCount; i++) {
                    materials[i] = allMaterials[mesh.subMeshes[i].material] ?? null;
                    if (!materials[i]) console.log(mesh.subMeshes[i].material);
                }
                meshRenderer.sharedMaterials = materials;
            }
        }

        // Physics.simulate = true;
        inspector.innerHTML = ``;

        let textures = [
            'depthRenderTexture',
            'colorRenderTexture',
            'worldNormalRenderTexture',
            'pbrRenderTexture',
            'emissiveRenderTexture',
            'lightingRenderTexture',
            'tonemappingRenderTexture',
        ];
        for (let i = 0; i < textures.length; i++) {
            const button = document.createElement('a');
            button.addEventListener('click', function () {
                renderPipeline.screenRenderPass.renderTexture = renderPipeline[textures[i]];
            });
            button.innerText = textures[i];
            hierarchy.appendChild(button);
        }
    });
});