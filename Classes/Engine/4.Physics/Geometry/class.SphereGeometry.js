class SphereGeometry {

    constructor(center, radius) {
        this.center = center;
        this.radius = radius;
    }

}

Geometry.check.SphereGeometry = {
    SphereGeometry: function (a, b) {
        return Vector3.Distance(a.center, b.center) < (a.radius + b.radius);
    },
    BoxGeometry: function (sphereGeometry, boxGeometry) {
        const direction = Vector3.Sub(sphereGeometry.center, boxGeometry.center);
        let closestPoint = boxGeometry.center.Clone();
        for (let i = 0; i < 3; i++) {
            const axis = boxGeometry.axes[i];
            const extent = boxGeometry.extents[i];
            let distance = Mathf.Clamp(direction.Dot(axis), -extent, extent);
            closestPoint = closestPoint.Add(axis.Multiply(distance));
        }
        return Vector3.Distance(sphereGeometry.center, closestPoint) < sphereGeometry.radius;
    },
    CylinderGeometry: function (sphere, cyl) {
        const d = Vector3.Sub(sphere.center, cyl.center);
        const distOnAxis = d.Dot(cyl.axis); // cyl.axis to zazwyczaj up (y)
        const clampedDist = Mathf.Clamp(distOnAxis, -cyl.height / 2, cyl.height / 2);

        const pointOnAxis = cyl.center.Add(cyl.axis.Multiply(clampedDist));
        const distFromAxis = Vector3.Distance(sphere.center, pointOnAxis);

        return distFromAxis < (sphere.radius + cyl.radius);
    },
    CapsuleGeometry: function (sphere, cap) {
        const capsuleVec = cap.end.Sub(cap.start);
        const t = Mathf.Clamp(Vector3.Sub(sphere.center, cap.start).Dot(capsuleVec) / capsuleVec.sqrMagnitude, 0, 1);
        const closestPointOnSegment = cap.start.Add(capsuleVec.Multiply(t));

        return Vector3.Distance(sphere.center, closestPointOnSegment) < (sphere.radius + cap.radius);
    },
    TriangleGeometry: function (sphere, a, b, c) {
        const closest = TriangleGeometry.ClosestPoint(sphere.center, a, b, c);
        const sqrDist = Vector3.Subtract(sphere.center, closest).sqrMagnitude;
        return sqrDist < (sphere.radius * sphere.radius);
    },

    TriangleMeshGeometry: function (sphere, mesh) {
        const indices = mesh.triangles;
        const verts = mesh.vertices;
        const len = indices.length;

        for (let i = 0; i < len; i += 3) {
            if (this.TriangleGeometry(
                sphere,
                verts[indices[i]],
                verts[indices[i + 1]],
                verts[indices[i + 2]]
            )) {
                return true;
            }
        }
        return false;
    },
};

Geometry.compute.SphereGeometry = {
    // Sfera (A) vs Sfera (B - statyczna)
    SphereGeometry: function (a, b) {
        const collisionVector = Vector3.Sub(a.center, b.center); // Od statycznego do dynamicznego
        const distance = collisionVector.magnitude;
        const radiusSum = a.radius + b.radius;

        if (distance >= radiusSum) return null;

        // Normalna w górę/bok, jeśli środki się pokrywają
        const normal = distance > 0.0001 ? collisionVector.Divide(distance) : new Vector3(0, 1, 0);
        const overlap = radiusSum - distance;

        return {
            point: b.center.Add(normal.Multiply(b.radius)), // Punkt na powierzchni statycznej sfery
            normal: normal,
            overlap: overlap,
        };
    },
    // Sfera (A) vs Box (B - statyczny)
    BoxGeometry: function (sphere, box) {
        const direction = Vector3.Sub(sphere.center, box.center);
        let closestPoint = box.center.Clone();

        for (let i = 0; i < 3; i++) {
            const axis = box.axes[i];
            const extent = box.extents[i];
            let dist = direction.Dot(axis);

            // Clampowanie do krawędzi boxa
            if (dist > extent) dist = extent;
            if (dist < -extent) dist = -extent;

            closestPoint = closestPoint.Add(axis.Multiply(dist));
        }

        const collisionVector = Vector3.Sub(sphere.center, closestPoint);
        const distance = collisionVector.magnitude;

        // Jeśli sfera jest poza zasięgiem najbliższego punktu boxa
        if (distance >= sphere.radius) return null;

        // Normalna od boxa do sfery
        // Jeśli środek sfery jest wewnątrz boxa, wypychamy w stronę najbliższej ściany
        const normal = distance > 0.0001 ? collisionVector.Divide(distance) : direction.Normalize();

        return {
            point: closestPoint,
            normal: normal,
            overlap: sphere.radius - distance,
        };
    },
    // Sfera (A) vs Kapsuła (B - statyczna)
    CapsuleGeometry: function (sphere, cap) {
        const capsuleVec = Vector3.Sub(cap.end, cap.start);
        const t = Math.max(0, Math.min(1, Vector3.Sub(sphere.center, cap.start).Dot(capsuleVec) / capsuleVec.sqrMagnitude));
        const closestPointOnSegment = cap.start.Add(capsuleVec.Multiply(t));

        const collisionVector = Vector3.Sub(sphere.center, closestPointOnSegment);
        const distance = collisionVector.magnitude;
        const radiusSum = sphere.radius + cap.radius;

        if (distance >= radiusSum) return null;

        const normal = distance > 0.0001 ? collisionVector.Divide(distance) : new Vector3(0, 1, 0);

        return {
            point: closestPointOnSegment.Add(normal.Multiply(cap.radius)),
            normal: normal,
            overlap: radiusSum - distance
        };
    },
    // Sfera (A) vs Cylinder (B - statyczny)
    CylinderGeometry: function (sphere, cyl) {
        const d = Vector3.Sub(sphere.center, cyl.center);
        const distOnAxis = d.Dot(cyl.axis);
        const clampedDist = Math.max(-cyl.height / 2, Math.min(cyl.height / 2, distOnAxis));

        const pointOnAxis = cyl.center.Add(cyl.axis.Multiply(clampedDist));
        const radialVec = Vector3.Sub(sphere.center, pointOnAxis);
        const radialDist = radialVec.magnitude;

        // Najbliższy punkt na powierzchni bocznej lub deklach cylindra
        const radialDir = radialDist > 0.0001 ? radialVec.Divide(radialDist) : cyl.axes[0];
        const closestPoint = pointOnAxis.Add(radialDir.Multiply(Math.min(radialDist, cyl.radius)));

        const collisionVector = Vector3.Sub(sphere.center, closestPoint);
        const distance = collisionVector.magnitude;

        if (distance >= sphere.radius && radialDist >= cyl.radius) return null;

        const normal = distance > 0.0001 ? collisionVector.Normalize() : d.Normalize();

        return {
            point: closestPoint,
            normal: normal,
            overlap: sphere.radius - distance
        };
    },
    TriangleGeometry: function (sphere, a, b, c) {
        // Używamy statycznej metody, przekazując bezpośrednio punkty
        const closestPoint = TriangleGeometry.ClosestPoint(sphere.center, a, b, c);
        const collisionVector = Vector3.Subtract(sphere.center, closestPoint);
        const distance = collisionVector.magnitude;

        if (distance >= sphere.radius) return null;

        // Normalna płaszczyzny trójkąta
        const edge1 = Vector3.Subtract(b, a);
        const edge2 = Vector3.Subtract(c, a);
        const triNormal = edge1.Cross(edge2).Normalize();

        // Jeśli środek sfery pokrywa się z najbliższym punktem, wypychamy zgodnie z normalną trójkąta
        const normal = distance > 0.0001 ? collisionVector.Divide(distance) : triNormal;

        return {
            point: closestPoint,
            normal: normal,
            overlap: sphere.radius - distance
        };
    },
    TriangleMeshGeometry: function (sphere, mesh) {
        let bestHit = null;
        // Zakładamy, że mesh.triangles to tablica indeksów, a mesh.vertices to tablica Vector3
        for (let i = 0; i < mesh.triangles.length; i += 3) {
            const v0 = mesh.vertices[mesh.triangles[i]];
            const v1 = mesh.vertices[mesh.triangles[i + 1]];
            const v2 = mesh.vertices[mesh.triangles[i + 2]];

            const hit = this.TriangleGeometry(sphere, v0, v1, v2);

            if (hit) {
                if (!bestHit || hit.overlap > bestHit.overlap) {
                    bestHit = hit;
                }
            }
        }
        return bestHit;
    }
};