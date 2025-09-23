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
                }

                mesh = new Mesh((line.split(' ')[1]).trim());
            } else if (line.startsWith('f ')) {
                line = line.split(' ');
                for (let l of line) {
                    if (l == 'f') continue;
                    l = l.split('/');

                    let vertexIndex = parseInt(l[0]) - 1;
                    let normalIndex = parseInt(l[2]) - 1;
                    let uvIndex = parseInt(l[1]) - 1;

                    mesh.vertices.push(vertices[vertexIndex]);
                    mesh.normals.push(normals[normalIndex]);
                    mesh.uvs.push(uvs[uvIndex]);
                    mesh.triangles.push(mesh.vertices.length - 1);
                }
            }
        }

        console.log(lines);
        console.log(meshes);

        callback(meshes);
    }

}