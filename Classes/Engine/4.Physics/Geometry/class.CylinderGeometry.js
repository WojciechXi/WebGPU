class CylinderGeometry {

    constructor(center, height, radius) {
        this.center = center;
        this.height = height;
        this.radius = radius;
        this.axis = Vector3.up;
        this.axes = [
            new Vector3(1, 0, 0),
            axis,
            new Vector3(0, 0, 1)
        ];
    }

}

Geometry.check.CylinderGeometry = {
    SphereGeometry: function (cylinder, sphere) {
        return Geometry.check.SphereGeometry.CylinderGeometry(sphere, cylinder);
    },
    BoxGeometry: function (cylinder, box) {
        return Geometry.check.BoxGeometry.CylinderGeometry(box, cylinder);
    },
    CylinderGeometry: function (a, b) {
        const dist = Vector3.Distance(a.center, b.center);
        return dist < (a.radius + b.radius) && Math.abs(a.center.y - b.center.y) < (a.height + b.height) / 2;
    },
    // CapsuleGeometry: function () { }
    TriangleGeometry: function (cylinder, triangle) {
        const closest = triangle.ClosestPoint(cylinder.center);
        return Geometry.check.CylinderGeometry.SphereGeometry(cylinder, { center: closest, radius: 0.001 });
    },
    TriangleMeshGeometry: function (cylinder, mesh) {
        for (const tri of mesh.triangles) {
            if (this.TriangleGeometry(cylinder, tri)) return true;
        }
        return false;
    },
};

Geometry.compute.CylinderGeometry = {
    SphereGeometry: function (cylinder, sphere) {
        const hit = Geometry.compute.SphereGeometry.CylinderGeometry(sphere, cylinder);
        if (!hit) return null;
        return {
            point: hit.point,
            normal: hit.normal.Negate(), // Wypychamy cylinder
            overlap: hit.overlap
        };
    },
    BoxGeometry: function (cylinder, box) {
        // Przybliżamy cylinder jako Box (OBB) do obliczeń SAT
        // Cylinder jako dynamiczny A, Box jako statyczny B
        const tempBoxA = {
            center: cylinder.center,
            extents: new Vector3(cylinder.radius, cylinder.height / 2, cylinder.radius),
            axes: cylinder.axes || [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)]
        };

        const hit = Geometry.compute.BoxGeometry.BoxGeometry(tempBoxA, box);
        return hit;
    },
    CylinderGeometry: function (a, b) {
        // Kolizja Cylinder-Cylinder (A dynamiczny, B statyczny)
        const diff = Vector3.Subtract(a.center, b.center);

        // Zakładamy orientację pionową (Y) dla uproszczenia, lub używamy a.axis
        const axis = a.axis || new Vector3(0, 1, 0);

        const yDist = diff.Dot(axis);
        const overlapY = (a.height / 2 + b.height / 2) - Math.abs(yDist);
        if (overlapY <= 0) return null;

        const radialVec = Vector3.Subtract(diff, axis.Multiply(yDist));
        const radialDist = radialVec.magnitude;
        const overlapRadial = (a.radius + b.radius) - radialDist;
        if (overlapRadial <= 0) return null;

        // SAT: Wybieramy mniejszy overlap (płaskie uderzenie vs boczne)
        if (overlapRadial < overlapY) {
            const normal = radialDist > 0.001 ? radialVec.Divide(radialDist) : new Vector3(1, 0, 0);
            return {
                point: b.center.Add(axis.Multiply(yDist)).Add(normal.Multiply(b.radius)),
                normal: normal,
                overlap: overlapRadial
            };
        } else {
            const normal = yDist > 0 ? axis : axis.Negate();
            return {
                point: a.center.Subtract(normal.Multiply(a.height / 2)),
                normal: normal,
                overlap: overlapY
            };
        }
    },
    CapsuleGeometry: function (cylinder, capsule) {
        // Aproksymacja kapsuły jako sfery w najbliższym punkcie
        const capsuleVec = Vector3.Subtract(capsule.end, capsule.start);
        const t = Math.max(0, Math.min(1, Vector3.Subtract(cylinder.center, capsule.start).Dot(capsuleVec) / capsuleVec.sqrMagnitude));
        const closestPoint = capsule.start.Add(capsuleVec.Multiply(t));

        const tempSphere = { center: closestPoint, radius: capsule.radius };
        return this.SphereGeometry(cylinder, tempSphere);
    },
    TriangleGeometry: function (cylinder, triangle) {
        // Przybliżamy cylinder jako Box dla kolizji z trójkątem
        const tempBox = {
            center: cylinder.center,
            extents: new Vector3(cylinder.radius, cylinder.height / 2, cylinder.radius),
            axes: cylinder.axes || [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)]
        };
        return Geometry.compute.BoxGeometry.TriangleGeometry(tempBox, triangle);
    },
    TriangleMeshGeometry: function (cylinder, mesh) {
        let bestHit = null;
        for (const tri of mesh.triangles) {
            const hit = this.TriangleGeometry(cylinder, tri);
            if (hit && (!bestHit || hit.overlap > bestHit.overlap)) bestHit = hit;
        }
        return bestHit;
    },
};