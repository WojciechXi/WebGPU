class Importer {

    static Obj(obj, callback) {
        let lines = obj.split("\n");

        let vertices = [];
        let normals = [];
        let uvs = [];

        for (let line of lines) {
            if (line.startsWith('v ')) {
                line = line.split(' ');
                let x = parseFloat(line[1]);
                let y = parseFloat(line[2]);
                let z = parseFloat(line[3]);
                vertices.push(new Vector3(x, y, z));
            } else if (line.startsWith('vn ')) {
                line = line.split(' ');
                let x = parseFloat(line[1]);
                let y = parseFloat(line[2]);
                let z = parseFloat(line[3]);
                normals.push(new Vector3(x, y, z));
            } else if (line.startsWith('vt ')) {
                line = line.split(' ');
                let x = parseFloat(line[1]);
                let y = parseFloat(line[2]);
                uvs.push(new Vector2(x, y));
            }
        }

        let meshes = [];
        let mesh = null;
        const meshVertices = [];
        const meshNormals = [];
        const meshUVs = [];
        const subMeshTriangles = [];

        for (let line of lines) {
            if (line.startsWith('usemtl')) {
                if (mesh) {
                    mesh.Update();
                    meshes.push(mesh);
                }
                mesh = new Mesh((line.split(' ')[1]).trim());
            } else if (line.startsWith('f ')) {
                line = line.split(' ');
                for (let l of line) {
                    if (l === 'f') continue;
                    l = l.split('/');

                    let vertexIndex = parseInt(l[0]) - 1;
                    let uvIndex = parseInt(l[1]) - 1;
                    let normalIndex = parseInt(l[2]) - 1;

                    meshVertices.push(vertices[vertexIndex]);
                    if (normals[normalIndex]) meshNormals.push(normals[normalIndex]);
                    if (uvs[uvIndex]) meshUVs.push(uvs[uvIndex]);
                    subMeshTriangles.push(meshVertices.length - 1);
                }
            }
        }

        if (mesh) {
            mesh.SetVertices(vertices);
            mesh.SetNormals(normals);
            mesh.SetUVs(uvs);
            mesh.SetSubMeshes([
                new SubMesh({
                    triangles: subMeshTriangles,
                }),
            ]);
            mesh.UploadMeshData();
            meshes.push(mesh);
        }

        callback(meshes);
    }

    static async GLTF(path, file, callback) {
        // 1. Pobieramy plik JSON glTF
        const res = await fetch(`${path}/${file}`);
        const gltf = await res.json();

        // 2. Wczytujemy plik binarny
        const bufferUri = gltf.buffers[0].uri;
        const bufferRes = await fetch(`${path}/${bufferUri}`);
        const arrayBuffer = await bufferRes.arrayBuffer();
        const intArrayBuffer = [new Uint8Array(arrayBuffer)];

        // Pomocnicza funkcja liczby komponentów
        function numComponents(type) {
            switch (type) {
                case 'SCALAR': return 1;
                case 'VEC2': return 2;
                case 'VEC3': return 3;
                case 'VEC4': return 4;
                case 'MAT4': return 16;
                default: throw new Error('Nieobsługiwany typ: ' + type);
            }
        }

        // 3. Funkcja do odczytu danych według accessorów
        function getAccessorData(gltf, accessorIndex) {
            const accessor = gltf.accessors[accessorIndex];
            if (!accessor) return null;

            const bufferView = gltf.bufferViews[accessor.bufferView];
            if (!bufferView) return null;

            const buffer = intArrayBuffer[bufferView.buffer];
            const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
            const length = accessor.count;
            const nComponents = numComponents(accessor.type);

            let TypedArray;
            switch (accessor.componentType) {
                case 5123: TypedArray = Uint16Array; break;
                case 5125: TypedArray = Uint32Array; break;
                case 5126: TypedArray = Float32Array; break;
                default: throw new Error("Unsupported componentType: " + accessor.componentType);
            }

            return new TypedArray(
                buffer.buffer,
                buffer.byteOffset + byteOffset,
                length * nComponents
            );
        }

        // Bezpieczne wywołanie accessorów
        function safeGetAccessorData(gltf, accessorIndex) {
            if (accessorIndex === undefined) return null;
            return getAccessorData(gltf, accessorIndex);
        }

        // 4. Tworzymy meshe
        let meshes = [];
        gltf.meshes.forEach((_mesh) => {
            _mesh.primitives.forEach((primitive) => {
                let mesh = new Mesh(_mesh.name);

                const _positions = safeGetAccessorData(gltf, primitive.attributes.POSITION);
                const _normals = safeGetAccessorData(gltf, primitive.attributes.NORMAL);
                const _tangents = safeGetAccessorData(gltf, primitive.attributes.TANGENT);
                const _uvs = safeGetAccessorData(gltf, primitive.attributes.TEXCOORD_0);
                const _indices = safeGetAccessorData(gltf, primitive.indices);

                let vertices = [];
                let normals = [];
                let tangents = [];
                let uvs = [];

                if (_positions) {
                    for (let i = 0; i < _positions.length; i += 3)
                        vertices.push(new Vector3(-_positions[i], _positions[i + 1], _positions[i + 2]));
                }

                if (_normals) {
                    for (let i = 0; i < _normals.length; i += 3)
                        normals.push(new Vector3(_normals[i], _normals[i + 1], _normals[i + 2]));
                }

                if (_tangents) {
                    for (let i = 0; i < _tangents.length; i += 4)
                        tangents.push(new Vector4(_tangents[i], _tangents[i + 1], _tangents[i + 2], _tangents[i + 3]));
                }

                if (_uvs) {
                    for (let i = 0; i < _uvs.length; i += 2)
                        uvs.push(new Vector2(_uvs[i], _uvs[i + 1]));
                }

                mesh.SetVertices(vertices);
                mesh.SetNormals(normals);
                mesh.SetTangents(tangents);
                mesh.SetUVs(uvs);

                let materialName = primitive.material !== undefined && gltf.materials
                    ? gltf.materials[primitive.material]?.name || "default"
                    : "default";

                let subMesh = new SubMesh({
                    triangles: _indices || [],
                    material: materialName,
                });

                mesh._subMeshes.push(subMesh);

                // mesh.RecalculateNormals?.();
                // mesh.RecalculateTangents?.();
                // mesh.RecalculateBounds?.();
                mesh.UploadMeshData();

                meshes.push(mesh);
            });
        });

        if (callback) callback(meshes, gltf.materials);
    }

    static async GLB(path, file, callback) {
        const res = await fetch(`${path}/${file}`);
        const arrayBuffer = await res.arrayBuffer();

        // 1. Odczyt nagłówka GLB (12 bajtów)
        const header = new DataView(arrayBuffer, 0, 12);
        const magic = header.getUint32(0, true);
        const version = header.getUint32(4, true);
        const totalLength = header.getUint32(8, true);

        if (magic !== 0x46546C67) { // "glTF" w ASCII
            console.error("To nie jest poprawny plik GLB");
            return;
        }

        // 2. Parsowanie Chunków
        let offset = 12;
        let gltfJson = null;
        let binaryBuffer = null;

        while (offset < totalLength) {
            const chunkHeader = new DataView(arrayBuffer, offset, 8);
            const chunkLength = chunkHeader.getUint32(0, true);
            const chunkType = chunkHeader.getUint32(4, true);
            offset += 8;

            if (chunkType === 0x4E4F534A) { // Typ "JSON"
                const jsonData = new Uint8Array(arrayBuffer, offset, chunkLength);
                const decoder = new TextDecoder("utf-8");
                gltfJson = JSON.parse(decoder.decode(jsonData));
            }
            else if (chunkType === 0x004E4942) { // Typ "BIN"
                binaryBuffer = arrayBuffer.slice(offset, offset + chunkLength);
            }

            offset += chunkLength;
        }

        if (!gltfJson || !binaryBuffer) {
            console.error("Błąd podczas odczytu struktury GLB");
            return;
        }

        // 3. Przekazujemy dane do uniwersalnego parsera
        // Musimy lekko zmodyfikować logikę, aby akceptowała gotowy buffer
        this._parseFromData(gltfJson, binaryBuffer, callback);
    }

    // Pomocnicza metoda, aby nie powtarzać kodu w GLTF i GLB
    static _parseFromData(gltf, arrayBuffer, callback) {
        const intArrayBuffer = new Uint8Array(arrayBuffer);

        // --- POMOCNIKI ---
        function numComponents(type) {
            const mapping = { 'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16 };
            return mapping[type] || 0;
        }

        function getAccessorData(accessorIndex) {
            if (accessorIndex === undefined || accessorIndex === null) return null;
            const accessor = gltf.accessors[accessorIndex];
            const bufferView = gltf.bufferViews[accessor.bufferView];
            const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);

            let TypedArray;
            switch (accessor.componentType) {
                case 5121: TypedArray = Uint8Array; break;
                case 5123: TypedArray = Uint16Array; break;
                case 5125: TypedArray = Uint32Array; break;
                case 5126: TypedArray = Float32Array; break;
                default: TypedArray = Float32Array;
            }

            return new TypedArray(
                intArrayBuffer.buffer,
                intArrayBuffer.byteOffset + byteOffset,
                accessor.count * numComponents(accessor.type)
            );
        }

        // --- 1. TEKSTURY (IMAGES) ---
        const textures = gltf.images ? gltf.images.map(i => {
            const bufferView = gltf.bufferViews[i.bufferView];
            const start = bufferView.byteOffset || 0;
            const end = start + bufferView.byteLength;
            const imageData = intArrayBuffer.slice(start, end);
            const blob = new Blob([imageData], { type: i.mimeType });
            return URL.createObjectURL(blob);
        }) : [];

        // --- 2. MATERIAŁY ---
        const materials = gltf.materials ? gltf.materials.map(m => {
            // const material = new Material({
            //     name: m.name,
            // });

            // baseColor: mat.pbrMetallicRoughness?.baseColorFactor || [1, 1, 1, 1],
            //     // Pobieramy index tekstury, jeśli istnieje
            //     diffuseTexture: mat.pbrMetallicRoughness?.baseColorTexture
            //         ? textures[gltf.textures[mat.pbrMetallicRoughness.baseColorTexture.index].source]
            //         : null

            return null;
        }) : [];

        // --- 3. MESHE ---
        let meshes = gltf.meshes ? gltf.meshes.map(m => {
            let mesh = new Mesh(m.name || "GLB_Mesh");

            for (let primitive of m.primitives) {
                const _pos = getAccessorData(primitive.attributes.POSITION);
                if (_pos) {
                    const v = [];
                    for (let i = 0; i < _pos.length; i += 3) v.push(new Vector3(-_pos[i] / 100, _pos[i + 1] / 100, _pos[i + 2] / 100));
                    mesh.SetVertices(v);
                }

                // UV (Tekstury)
                const _uvs = getAccessorData(primitive.attributes.TEXCOORD_0);
                if (_uvs) {
                    const u = [];
                    for (let i = 0; i < _uvs.length; i += 2) u.push(new Vector2(_uvs[i], _uvs[i + 1]));
                    mesh.SetUVs(u);
                }

                // Indeksy (Triangles)
                const triangles = getAccessorData(primitive.indices);
                mesh.SetSubMeshes([new SubMesh({ triangles: new Uint32Array(triangles) })]);

                mesh.UploadMeshData();
            }

            return mesh;
        }) : [];

        // --- 4. ANIMACJE ---
        const animations = gltf.animations ? gltf.animations.map(a => {
            const channels = a.channels.map(channel => {
                const sampler = a.samplers[channel.sampler];
                return {
                    targetNode: channel.target.node,
                    path: channel.target.path, // "translation", "rotation", "scale"
                    times: getAccessorData(sampler.input),
                    values: getAccessorData(sampler.output)
                };
            });

            return { name: a.name, channels };
        }) : [];

        // --- SKINS (Dane szkieletu) ---
        const skins = gltf.skins ? gltf.skins.map(s => {
            return {
                name: s.name,
                joints: s.joints,
                inverseBindMatrices: getAccessorData(s.inverseBindMatrices)
            };
        }) : [];

        // const _joints = getAccessorData(primitive.attributes.JOINTS_0);
        // if (_joints) {
        //     const j = [];
        //     // JOINTS_0 to zazwyczaj VEC4 (4 wartości na wierzchołek)
        //     for (let i = 0; i < _joints.length; i += 4) {
        //         j.push([_joints[i], _joints[i + 1], _joints[i + 2], _joints[i + 3]]);
        //     }
        //     mesh.SetBoneIndices(j); // Zakładając, że Twoja klasa Mesh to obsługuje
        // }

        // const _weights = getAccessorData(primitive.attributes.WEIGHTS_0);
        // if (_weights) {
        //     const w = [];
        //     for (let i = 0; i < _weights.length; i += 4) {
        //         w.push([_weights[i], _weights[i + 1], _weights[i + 2], _weights[i + 3]]);
        //     }
        //     mesh.SetBoneWeights(w);
        // }

        const rootGameObject = new GameObject("Game Object");

        const gameObjects = gltf.nodes.map((node, index) => {
            const gameObject = new GameObject(node.name || `Node_${index}`, null, DebugTransform);
            if (node.skin >= 0 && node.mesh >= 0) {
                const meshRenderer = gameObject.AddComponent(MeshRenderer);
                meshRenderer.mesh = meshes[node.mesh];
                console.log(meshRenderer);
            }
            return gameObject;
        });

        gameObjects.forEach(function (gameObject, index) {
            const node = gltf.nodes[index];
            if (node.children) for (let childIndex of node.children) gameObjects[childIndex].transform.SetParent(gameObject.transform);
            if (node.rotation) gameObject.transform.localRotation = new Quaternion(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]);
            if (node.translation) gameObject.transform.localPosition = new Vector3(node.translation[0] * 0.01, node.translation[1] * 0.01, node.translation[2] * 0.01);
        });

        gameObjects.forEach(function (gameObject, index) {
            if (gameObject.transform.parent) return;
            gameObject.transform.SetParent(rootGameObject.transform);
        });

        // --- FINALNY CALLBACK ---
        if (callback) {
            callback({
                meshes: meshes,
                materials: materials,
                animations: animations,
                textures: textures,
                skins: skins,
                gameObjects: gameObjects,
                rootGameObject: rootGameObject,
            });
        }
    }

}
