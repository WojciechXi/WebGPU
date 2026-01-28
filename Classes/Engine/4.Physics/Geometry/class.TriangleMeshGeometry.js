class TriangleMeshGeometry {

    constructor(triangles) {
        this.triangles = triangles;
    }

}

Geometry.check.TriangleMeshGeometry = {
    SphereGeometry: function (mesh, sphere) {
        for (const tri of mesh.triangles) {
            if (Geometry.check.TriangleGeometry.SphereGeometry(tri, sphere)) return true;
        }
        return false;
    },
    BoxGeometry: function (mesh, box) {
        for (const tri of mesh.triangles) {
            if (Geometry.check.TriangleGeometry.BoxGeometry(tri, box)) return true;
        }
        return false;
    }
};

Geometry.compute.TriangleMeshGeometry = {
    SphereGeometry: function (mesh, sphere) {
        let bestHit = null;

        for (const tri of mesh.triangles) {
            const hit = Geometry.compute.TriangleGeometry.SphereGeometry(sphere, tri);
            if (hit) {
                // Szukamy najgłębszej kolizji, aby uniknąć "drżenia" na krawędziach trójkątów
                if (!bestHit || hit.overlap > bestHit.overlap) {
                    bestHit = hit;
                }
            }
        }
        return bestHit;
    },

    BoxGeometry: function (mesh, box) {
        let bestHit = null;

        for (const tri of mesh.triangles) {
            const hit = Geometry.compute.TriangleGeometry.BoxGeometry(box, tri);
            if (hit) {
                if (!bestHit || hit.overlap > bestHit.overlap) {
                    bestHit = hit;
                }
            }
        }
        return bestHit;
    },

    CapsuleGeometry: function (mesh, capsule) {
        let bestHit = null;

        for (const tri of mesh.triangles) {
            const hit = Geometry.compute.TriangleGeometry.CapsuleGeometry(capsule, tri);
            if (hit) {
                if (!bestHit || hit.overlap > bestHit.overlap) {
                    bestHit = hit;
                }
            }
        }
        return bestHit;
    },

    CylinderGeometry: function (mesh, cylinder) {
        // Uproszczenie: traktujemy cylinder jak box (OBB)
        const tempBox = {
            center: cylinder.center,
            extents: new Vector3(cylinder.radius, cylinder.height / 2, cylinder.radius),
            axes: cylinder.axes || [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)]
        };
        return this.BoxGeometry(mesh, tempBox);
    }
};