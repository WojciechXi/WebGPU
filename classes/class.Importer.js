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

                let vertex = new Vector3(x, y, z);

                vertices.push(vertex);
            } else if (line.startsWith('vn ')) {
                line = line.split(' ');
                let x = parseFloat(line[1]);
                let y = parseFloat(line[2]);
                let z = parseFloat(line[3]);

                let normal = new Vector3(x, y, z);

                normals.push(normal);
            } else if (line.startsWith('vt ')) {
                line = line.split(' ');
                let x = parseFloat(line[1]);
                let y = parseFloat(line[2]);

                let uv = new Vector2(x, y);

                uvs.push(uv);
            }
        }

        let meshes = [];

        let mesh = null;
        for (let line of lines) {
            if (line.startsWith('usemtl')) {
                if (mesh) {
                    mesh.Update();
                    meshes.push(mesh);
                    mesh = null;
                }

                mesh = new Mesh((line.split(' ')[1]).trim());
            } else if (line.startsWith('f ')) {
                line = line.split(' ');
                for (let l of line) {
                    if (l == 'f') continue;
                    l = l.split('/');

                    let vertexIndex = parseInt(l[0]) - 1;
                    let uvIndex = parseInt(l[1]) - 1;
                    let normalIndex = parseInt(l[2]) - 1;

                    mesh.vertices.push(vertices[vertexIndex]);
                    mesh.triangles.push(mesh.vertices.length - 1);
                    mesh.uvs.push(uvs[uvIndex]);
                    mesh.normals.push(normals[normalIndex]);
                }
            }
        }

        if (mesh) {
            mesh.Update();
            meshes.push(mesh);
            mesh = null;
        }

        callback(meshes);
    }

    static async GLTF(path, file, callback) {
        // 1. Pobieramy plik JSON glTF
        const res = await fetch(`${path}/${file}`);
        const gltf = await res.json();
        console.log('Cały glTF JSON:', gltf);

        // 2. Zakładamy, że pierwszy buffer jest binarny
        const bufferUri = gltf.buffers[0].uri;
        const bufferRes = await fetch(`${path}/${bufferUri}`);
        const arrayBuffer = await bufferRes.arrayBuffer();
        const intArrayBuffer = [new Uint8Array(arrayBuffer)];

        // Pomocnicza funkcja do liczby komponentów w accessorze
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
            const bufferView = gltf.bufferViews[accessor.bufferView];
            const buffer = intArrayBuffer[bufferView.buffer]; // Uint8Array z pliku .bin

            const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
            const length = accessor.count;
            const numComponents = {
                SCALAR: 1,
                VEC2: 2,
                VEC3: 3,
                VEC4: 4,
                MAT4: 16
            }[accessor.type];

            let TypedArray;
            switch (accessor.componentType) {
                case 5123: TypedArray = Uint16Array; break;
                case 5125: TypedArray = Uint32Array; break;
                case 5126: TypedArray = Float32Array; break;
                default: throw new Error("Unsupported componentType");
            }

            const array = new TypedArray(
                buffer.buffer,
                buffer.byteOffset + byteOffset,
                length * numComponents
            );

            return array;
        }

        let meshes = [];
        gltf.meshes.forEach((_mesh) => {
            let mesh = new Mesh(_mesh.name);

            _mesh.primitives.forEach((primitive) => {
                const _positions = getAccessorData(gltf, primitive.attributes.POSITION);
                const _normals = getAccessorData(gltf, primitive.attributes.NORMAL);
                const _tangents = getAccessorData(gltf, primitive.attributes.TANGENT);
                const _uvs = getAccessorData(gltf, primitive.attributes.TEXCOORD_0);
                const _indices = getAccessorData(gltf, primitive.indices);

                let vertices = [];
                let normals = [];
                let tangents = [];
                let uvs = [];

                for (let i = 0; i < _positions.length; i += 3) vertices.push(new Vector3(_positions[i], _positions[i + 1], _positions[i + 2]));
                for (let i = 0; i < _normals.length; i += 3) normals.push(new Vector3(_normals[i], _normals[i + 1], _normals[i + 2]));
                for (let i = 0; i < _tangents.length; i += 4) tangents.push(new Vector4(_tangents[i], _tangents[i + 1], _tangents[i + 2], _tangents[i + 3]));
                for (let i = 0; i < _uvs.length; i += 2) uvs.push(new Vector2(_uvs[i], _uvs[i + 1]));

                let subMesh = new SubMesh({
                    vertices: vertices,
                    normals: normals,
                    tangents: tangents,
                    uvs: uvs,
                    triangles: _indices,
                });

                mesh.subMeshes.push(subMesh);
            });

            mesh.Update();
            meshes.push(mesh);
        });

        console.log(meshes);

        if (callback) callback(meshes);
    }

}