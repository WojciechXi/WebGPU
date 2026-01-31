class Graphics {

    static {
        this.lightViewProjectionMatrix = Matrix4x4.Identity();
        this.lightDirection = Vector3.down;
        this.lightColor = Color.white;
        this.ambientLightColor = Color.zero;
    }

    static get Width() { return this.canvas.width; }
    static get Height() { return this.canvas.height; }

    static async Init(callback) {
        this.canvas = document.querySelector('#view');
        this.canvas.focus();

        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        this.context = this.canvas.getContext('webgpu');
        this.context.configure({
            device: GPU.device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'premultiplied',
        });

        this.lineMesh = new Mesh("Line");
        this.lineMesh.SetVertices([Vector3.zero, Vector3.forward,]);
        this.lineMesh.SetSubMeshes([new SubMesh({ edges: [0, 1], })]);
        this.lineMesh.UploadMeshData();

        this.planeMesh = new Mesh("Plane");
        this.planeMesh.SetVertices([new Vector3(-0.5, 0, -0.5), new Vector3(0.5, 0, -0.5), new Vector3(0.5, 0, 0.5), new Vector3(-0.5, 0, 0.5)]);
        this.planeMesh.SetNormals([Vector3.up, Vector3.up, Vector3.up, Vector3.up]);
        this.planeMesh.SetUVs([new Vector2(0, 0), new Vector2(1, 0), new Vector2(1, 1), new Vector2(0, 1)]);
        this.planeMesh.SetTangents([new Vector4(0, 1, 0, 1), new Vector4(0, 1, 0, 1), new Vector4(0, 1, 0, 1), new Vector4(0, 1, 0, 1)]);
        this.planeMesh.SetSubMeshes([
            new SubMesh({
                triangles: [0, 1, 2, 0, 2, 3,],
                edges: [0, 1, 1, 2, 2, 3, 3, 0,],
            })
        ]);
        this.planeMesh.UploadMeshData();

        const cubeVertices = [
            new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, -0.5, -0.5), new Vector3(0.5, -0.5, 0.5), new Vector3(-0.5, -0.5, 0.5),
            new Vector3(-0.5, 0.5, -0.5), new Vector3(0.5, 0.5, -0.5), new Vector3(0.5, 0.5, 0.5), new Vector3(-0.5, 0.5, 0.5),
        ];
        this.cubeMesh = new Mesh("Cube");
        this.cubeMesh.SetVertices(cubeVertices);
        this.cubeMesh.SetNormals(cubeVertices.map(v => v.normalized));
        this.cubeMesh.SetUVs([new Vector2(0, 0), new Vector2(1, 0), new Vector2(1, 1), new Vector2(0, 1), new Vector2(0, 0), new Vector2(1, 0), new Vector2(1, 1), new Vector2(0, 1)]);
        this.cubeMesh.SetTangents(cubeVertices.map(v => {
            const tangent = (Math.abs(v.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(0, 0, 1)).Cross(v).normalized;
            return new Vector4(tangent.x, tangent.y, tangent.z, 1.0);
        }));
        this.cubeMesh.SetSubMeshes([
            new SubMesh({
                triangles: [3, 6, 2, 3, 7, 6, 1, 4, 0, 1, 5, 4, 7, 5, 6, 7, 4, 5, 0, 2, 1, 0, 3, 2, 2, 5, 1, 2, 6, 5, 0, 7, 3, 0, 4, 7],
                edges: [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7],
            })
        ]);
        this.cubeMesh.UploadMeshData();

        this.icoMesh = this.CreateIcoSphere(0.5, 1);
        this.sphereMesh = this.CreateUVSphereMesh(0.5);

        callback();
    }

    static Awake() {
        this.viewBindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'ViewBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, }
            ],
        });

        this.lightBindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'LightBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, }
            ],
        });

        this.materialBindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'TransformBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, }
            ],
        });

        this.pbrBindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'ViewBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: {}, },
                { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                { binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                { binding: 4, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
                { binding: 5, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}, },
            ],
        });

        this.jointsBindGroupLayout = GPU.CreateBindGroupLayout({
            label: 'JointBindGroupLayout',
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' }, }
            ],
        });

        const sceneRenderTexture = new RenderTexture(this.canvas.width, this.canvas.height, { format: 'rgba16float', });

        this.shadowRenderPass = new ShadowRenderPass({
            name: 'shadowRenderPass',
            code: Resources.Get('/Resources/Shaders/shadowRenderPass.wgsl'),
            canvas: this.canvas,
        });

        this.gBufferRenderPass = new GBufferRenderPass({
            name: 'gBufferRenderPass',
            canvas: this.canvas,
        });

        this.lightingRenderPass = new LightingRenderPass({
            name: 'lightingRenderPass',
            code: Resources.Get('/Resources/Shaders/lightingRenderPass.wgsl'),
            shadowRenderPass: this.shadowRenderPass,
            gBufferRenderPass: this.gBufferRenderPass,
            canvas: this.canvas,
        });

        // this.ssaoRenderPass = new SSAORenderPass({
        //     name: 'ssaoRenderPass',
        //     code: Resources.Get('/Resources/Shaders/ssaoRenderPass.wgsl'),
        //     gBufferRenderPass: this.gBufferRenderPass,
        //     inputRenderTexture: this.lightingRenderPass.sceneRenderTexture,
        //     canvas: this.canvas,
        // });

        this.bloomRenderPass = new BloomRenderPass({
            name: 'bloomRenderPass',
            code: Resources.Get('/Resources/Shaders/bloomRenderPass.wgsl'),
            inputRenderTexture: this.lightingRenderPass.sceneRenderTexture,
            canvas: this.canvas,
        });

        this.tonemappingRenderPass = new TonemappingRenderPass({
            name: 'tonemappingRenderPass',
            code: Resources.Get('/Resources/Shaders/tonemappingRenderPass.wgsl'),
            inputRenderTexture: this.bloomRenderPass.sceneRenderTexture,
            canvas: this.canvas,
        });

        this.screenRenderPass = new ScreenRenderPass({
            name: 'screenRenderPass',
            code: Resources.Get('/Resources/Shaders/screenRenderPass.wgsl'),
            canvas: this.canvas,
        });

        this.screenRenderPass.renderTexture = this.tonemappingRenderPass.sceneRenderTexture;

        this.gizmosRenderPass = new GizmosRenderPass({
            name: 'gizmosRenderPass',
            code: Resources.Get('/Resources/Shaders/gizmosRenderPass.wgsl'),
            canvas: this.canvas,
        });
    }

    static set Preview(value) {
        switch (value) {
            case 1:
                this.screenRenderPass.renderTexture = this.shadowRenderPass.depthRenderTexture;
                return;
            case 2:
                this.screenRenderPass.renderTexture = this.gBufferRenderPass.positionRenderTexture;
                return;
            case 3:
                this.screenRenderPass.renderTexture = this.gBufferRenderPass.normalRenderTexture;
                return;
            case 4:
                this.screenRenderPass.renderTexture = this.gBufferRenderPass.colorRenderTexture;
                return;
            case 5:
                this.screenRenderPass.renderTexture = this.gBufferRenderPass.depthRenderTexture;
                return;
            case 6:
                this.screenRenderPass.renderTexture = this.lightingRenderPass.sceneRenderTexture;
                return;
            case 7:
                this.screenRenderPass.renderTexture = this.bloomRenderPass.bloomRenderTexture;
                return;
            case 8:
                this.screenRenderPass.renderTexture = this.tonemappingRenderPass.sceneRenderTexture;
                return;
        }
    }

    static Render(scene) {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        for (let camera of scene.cameras) camera.SendMessage("OnPreRender");

        const commandEncoder = this.commandEncoder = GPU.CreateCommandEncoder();

        if (this.shadowRenderPass) this.shadowRenderPass.Render(scene.cameras, scene, commandEncoder);
        this.RenderCameras(scene.cameras, scene, commandEncoder);

        GPU.Queue.submit([commandEncoder.finish()]);

        for (let camera of scene.cameras) camera.SendMessage("OnPostRender");
    }

    static RenderCameras(cameras, scene, commandEncoder) {
        if (this.gBufferRenderPass) this.gBufferRenderPass.Render(cameras, scene, commandEncoder);

        if (this.lightingRenderPass) this.lightingRenderPass.Render(cameras, scene, commandEncoder);
        if (this.forwardRenderPass) this.forwardRenderPass.Render(cameras, scene, commandEncoder);
        if (this.finalRenderPass) this.finalRenderPass.Render(cameras, scene, commandEncoder);

        if (this.ssaoRenderPass) this.ssaoRenderPass.Render(cameras, scene, commandEncoder);
        if (this.screenSpaceReflectionRenderPass) this.screenSpaceReflectionRenderPass.Render(cameras, scene, commandEncoder);
        if (this.bloomRenderPass) this.bloomRenderPass.Render(cameras, scene, commandEncoder);
        if (this.tonemappingRenderPass) this.tonemappingRenderPass.Render(cameras, scene, commandEncoder);

        if (this.screenRenderPass) this.screenRenderPass.Render(cameras, scene, commandEncoder);
        if (this.gizmosRenderPass) this.gizmosRenderPass.Render(cameras, scene, commandEncoder);
    }

    static CreateUVSphereMesh(radius = 0.5, latitudes = 16, longitudes = 16) {
        let vertices = [];
        let tangents = [];
        let uvs = [];

        let edges = [];
        let triangles = [];

        for (let lat = 0; lat <= latitudes; lat++) {
            let theta = lat * Math.PI / latitudes;
            let sinTheta = Mathf.Sin(theta);
            let cosTheta = Mathf.Cos(theta);

            for (let lon = 0; lon <= longitudes; lon++) {
                let phi = lon * 2 * Math.PI / longitudes;
                let sinPhi = Mathf.Sin(phi);
                let cosPhi = Mathf.Cos(phi);

                let x = cosPhi * sinTheta;
                let y = cosTheta;
                let z = sinPhi * sinTheta;

                vertices.push(new Vector3(x, y, z).Multiply(radius));
                tangents.push(new Vector4(-sinPhi, 0, cosPhi, 1.0).normalizedTangent);
                uvs.push(new Vector2(lon / longitudes, lat / latitudes));
            }
        }

        for (let lat = 0; lat < latitudes; lat++) {
            for (let lon = 0; lon < longitudes; lon++) {
                let first = (lat * (longitudes + 1)) + lon;
                let second = first + longitudes + 1;

                edges.push(first, first + 1);
                edges.push(first, second);

                triangles.push(first, second, first + 1);
                triangles.push(second, second + 1, first + 1);
            }
        }

        const mesh = new Mesh("Ico");
        mesh.SetVertices(vertices);
        mesh.SetNormals(vertices.map(v => v.normalized));
        mesh.SetTangents(tangents);
        mesh.SetUVs(uvs);
        mesh.SetSubMeshes([
            new SubMesh({
                triangles: triangles,
                edges: edges,
            })
        ]);
        mesh.UploadMeshData();

        return mesh;
    }

    static CreateIcoSphere(radius = 0.5, subdivisions = 0) {
        const t = (1 + Mathf.Sqrt(5)) / 2;
        let vertices = [
            new Vector3(-1, t, 0), new Vector3(1, t, 0), new Vector3(-1, -t, 0), new Vector3(1, -t, 0),
            new Vector3(0, -1, t), new Vector3(0, 1, t), new Vector3(0, -1, -t), new Vector3(0, 1, -t),
            new Vector3(t, 0, -1), new Vector3(t, 0, 1), new Vector3(-t, 0, -1), new Vector3(-t, 0, 1)
        ].map(v => v.normalized.Multiply(radius));

        // Odwrócone wierzchołki w bazowych ścianach (zmienione [a, b, c] na [a, c, b])
        let faces = [
            [0, 5, 11], [0, 1, 5], [0, 7, 1], [0, 10, 7], [0, 11, 10],
            [1, 9, 5], [5, 4, 11], [11, 2, 10], [10, 6, 7], [7, 8, 1],
            [3, 4, 9], [3, 2, 4], [3, 6, 2], [3, 8, 6], [3, 9, 8],
            [4, 5, 9], [2, 11, 4], [6, 10, 2], [8, 7, 6], [9, 1, 8]
        ];

        const cache = {};

        const getMiddlePoint = (p1, p2) => {
            const key = Mathf.Min(p1, p2) + "_" + Mathf.Max(p1, p2);
            if (cache[key] !== undefined) return cache[key];

            const v1 = vertices[p1];
            const v2 = vertices[p2];
            const middle = new Vector3(
                (v1.x + v2.x) / 2,
                (v1.y + v2.y) / 2,
                (v1.z + v2.z) / 2
            ).Normalize().Multiply(radius);

            vertices.push(middle);
            cache[key] = vertices.length - 1;
            return cache[key];
        };

        // Rekurencyjne dzielenie trójkątów
        for (let i = 0; i < subdivisions; i++) {
            let faces2 = [];
            for (let tri of faces) {
                const a = getMiddlePoint(tri[0], tri[1]);
                const b = getMiddlePoint(tri[1], tri[2]);
                const c = getMiddlePoint(tri[2], tri[0]);

                // Tutaj również dbamy o kolejność CCW
                faces2.push([tri[0], a, c]);
                faces2.push([tri[1], b, a]);
                faces2.push([tri[2], c, b]);
                faces2.push([a, b, c]);
            }
            faces = faces2;
        }

        // Wyciągamy krawędzie
        const edgeSet = new Set();
        const edges = [];
        for (let f of faces) {
            const addEdge = (v1, v2) => {
                const key = Mathf.Min(v1, v2) + "_" + Mathf.Max(v1, v2);
                if (!edgeSet.has(key)) {
                    edgeSet.add(key);
                    edges.push(v1, v2);
                }
            };
            addEdge(f[0], f[1]);
            addEdge(f[1], f[2]);
            addEdge(f[2], f[0]);
        }

        const mesh = new Mesh("Sphere");
        mesh.SetVertices(vertices);
        mesh.SetNormals(vertices.map(v => v.normalized));
        mesh.SetTangents(vertices.map(v => {
            const n = v.normalized;
            let t = new Vector3(-n.z, 0, n.x).normalized;
            return new Vector4(t.x, t.y, t.z, 1.0);
        }));
        mesh.SetSubMeshes([
            new SubMesh({
                triangles: faces.flat(),
                edges: edges
            })
        ]);
        mesh.UploadMeshData();

        return mesh;
    }

}