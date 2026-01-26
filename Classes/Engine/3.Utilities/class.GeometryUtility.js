class GeometryUtility {

    static CalculateBounds(positions, transform) {
        if (!positions || positions.length === 0) return new Bounds(Vector3.zero, Vector3.zero);

        let min = Vector3.positiveInfinity;
        let max = Vector3.negativeInfinity;

        for (let i = 0; i < positions.length; i++) {
            let position = positions[i];

            let x = position.x;
            let y = position.y;
            let z = position.z;

            if (transform) {
                const tx = transform[0] * x + transform[4] * y + transform[8] * z + transform[12];
                const ty = transform[1] * x + transform[5] * y + transform[9] * z + transform[13];
                const tz = transform[2] * x + transform[6] * y + transform[10] * z + transform[14];

                x = tx;
                y = ty;
                z = tz;
            }

            if (x < min.x) min.x = x;
            if (y < min.y) min.y = y;
            if (z < min.z) min.z = z;

            if (x > max.x) max.x = x;
            if (y > max.y) max.y = y;
            if (z > max.z) max.z = z;
        }

        return Bounds.FromMinMax(min, max);
    }

    static CalculateFrustumPlanes(camera) {
        const vpm = camera.viewProjectionMatrix;
        return [
            Plane.FromInNormalDistance(new Vector3(vpm[3] + vpm[0], vpm[7] + vpm[4], vpm[11] + vpm[8]), vpm[15] + vpm[12]), // Left
            Plane.FromInNormalDistance(new Vector3(vpm[3] - vpm[0], vpm[7] - vpm[4], vpm[11] - vpm[8]), vpm[15] - vpm[12]), // Right
            Plane.FromInNormalDistance(new Vector3(vpm[3] + vpm[1], vpm[7] + vpm[5], vpm[11] + vpm[9]), vpm[15] + vpm[13]), // Bottom
            Plane.FromInNormalDistance(new Vector3(vpm[3] - vpm[1], vpm[7] - vpm[5], vpm[11] - vpm[9]), vpm[15] - vpm[13]), // Top
            Plane.FromInNormalDistance(new Vector3(vpm[2], vpm[6], vpm[10]), vpm[14]),                              // Near
            Plane.FromInNormalDistance(new Vector3(vpm[3] - vpm[2], vpm[7] - vpm[6], vpm[11] - vpm[10]), vpm[15] - vpm[14]) // Far
        ];
    }

    static TestPlanesAABB(planes, bounds) {
        const min = bounds.min;
        const max = bounds.max;

        for (let i = 0; i < planes.length; i++) {
            const plane = planes[i];
            const normal = plane.normal;

            const point = new Vector3(normal.x >= 0 ? max.x : min.x, normal.y >= 0 ? max.y : min.y, normal.z >= 0 ? max.z : min.z);

            if (plane.GetDistanceToPoint(point) < 0) return false;
        }

        return true;
    }

    static TryCreatePlaneFromPolygon(vertices, callback) {
        if (!vertices || vertices.length < 3) return false;

        const p1 = vertices[0];
        const p2 = vertices[1];
        const p3 = vertices[2];

        const v1 = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
        const v2 = { x: p3.x - p1.x, y: p3.y - p1.y, z: p3.z - p1.z };

        const nx = v1.y * v2.z - v1.z * v2.y;
        const ny = v1.z * v2.x - v1.x * v2.z;
        const nz = v1.x * v2.y - v1.y * v2.x;

        const mag = Mathf.Sqrt(nx * nx + ny * ny + nz * nz);
        if (mag < 1e-6) return false;

        const normal = new Vector3(nx / mag, ny / mag, nz / mag);
        const distance = -(normal.x * p1.x + normal.y * p1.y + normal.z * p1.z);

        const plane = new Plane(normal, distance);
        if (callback) callback(plane);
        return true;
    }

}