class BoxGeometry {

    constructor(center, extents, axes) {
        this.center = center;
        this.extents = extents;
        this.axes = axes;
    }

    static IsSeparated(L, T, a, b) {
        const distProjection = Mathf.Abs(T.Dot(L));

        const radiusA = a.extents.x * Mathf.Abs(a.axes[0].Dot(L)) + a.extents.y * Mathf.Abs(a.axes[1].Dot(L)) + a.extents.z * Mathf.Abs(a.axes[2].Dot(L));
        const radiusB = b.extents.x * Mathf.Abs(b.axes[0].Dot(L)) + b.extents.y * Mathf.Abs(b.axes[1].Dot(L)) + b.extents.z * Mathf.Abs(b.axes[2].Dot(L));

        return distProjection > (radiusA + radiusB);
    }

    static GetOverlap(L, T, a, b) {
        const distProjection = Mathf.Abs(T.Dot(L));

        const radiusA = a.extents.x * Mathf.Abs(a.axes[0].Dot(L)) + a.extents.y * Mathf.Abs(a.axes[1].Dot(L)) + a.extents.z * Mathf.Abs(a.axes[2].Dot(L));
        const radiusB = b.extents.x * Mathf.Abs(b.axes[0].Dot(L)) + b.extents.y * Mathf.Abs(b.axes[1].Dot(L)) + b.extents.z * Mathf.Abs(b.axes[2].Dot(L));

        return (radiusA + radiusB) - distProjection;
    }

    static GetContactPoint(boxGeometry, normal) {
        let closestPoint = boxGeometry.center.Clone();
        for (let i = 0; i < 3; i++) {
            let dot = boxGeometry.axes[i].Dot(normal);
            let sign = dot > 0 ? -1 : 1;
            closestPoint = Vector3.Add(closestPoint, boxGeometry.axes[i].Multiply(boxGeometry.extents[i] * sign));
        }
        return closestPoint;
    }

}

Geometry.check.BoxGeometry = {
    SphereGeometry: function (boxGeometry, sphereGeometry) {
        return Geometry.check.SphereGeometry.BoxGeometry(sphereGeometry, boxGeometry);
    },
    BoxGeometry: function (a, b) {
        const T = Vector3.Subtract(b.center, a.center);
        // Test 6 osi podstawowych
        for (let i = 0; i < 3; i++) {
            if (BoxGeometry.IsSeparated(a.axes[i], T, a, b)) return false;
            if (BoxGeometry.IsSeparated(b.axes[i], T, a, b)) return false;
        }
        // Test 9 osi krawędziowych
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const axisToCheck = a.axes[i].Cross(b.axes[j]);
                if (axisToCheck.sqrMagnitude < 0.001) continue;
                if (BoxGeometry.IsSeparated(axisToCheck, T, a, b)) return false;
            }
        }
        return true;
    },
    CylinderGeometry: function (box, cyl) {
        // Przybliżenie sferyczne dla szybkiego testu
        const combinedRadius = box.extents.magnitude + Math.max(cyl.radius, cyl.height / 2);
        return Vector3.Distance(box.center, cyl.center) < combinedRadius;
    },
    CapsuleGeometry: function (box, cap) {
        // Przybliżenie sferyczne dla szybkiego testu
        const capLength = Vector3.Distance(cap.start, cap.end);
        const combinedRadius = box.extents.magnitude + (capLength / 2) + cap.radius;
        return Vector3.Distance(box.center, Vector3.Lerp(cap.start, cap.end, 0.5)) < combinedRadius;
    },
    TriangleGeometry: function (box, a, b, c) {
        const closest = TriangleGeometry.ClosestPoint(box.center, a, b, c);
        return Geometry.check.BoxGeometry.SphereGeometry(box, { center: closest, radius: 0.001 });
    },
    TriangleMeshGeometry: function (box, mesh) {
        const closestOnTri = TriangleGeometry.ClosestPoint(box.center, a, b, c);
        // Traktujemy punkt na trójkącie jako sferę o promieniu 0
        const hit = Geometry.compute.BoxGeometry.SphereGeometry(box, { center: closestOnTri, radius: 0 });
        if (!hit) return null;

        // Obliczamy właściwą normalną trójkąta dla poprawnego wypchnięcia
        const edge1 = Vector3.Subtract(b, a);
        const edge2 = Vector3.Subtract(c, a);
        const triNormal = edge1.Cross(edge2).Normalize();

        // Jeśli środek boxa jest pod trójkątem, odwracamy normalną
        if (triNormal.Dot(Vector3.Subtract(box.center, a)) < 0) triNormal.Negate();

        return {
            point: closestOnTri,
            normal: triNormal,
            overlap: hit.overlap
        };
    },
};

Geometry.compute.BoxGeometry = {
    SphereGeometry: function (box, sphere) {
        const hit = Geometry.compute.SphereGeometry.BoxGeometry(sphere, box);
        if (!hit) return null;
        return {
            point: hit.point,
            normal: hit.normal.Negate(), // Odwracamy, by wypychać Boxa
            overlap: hit.overlap
        };
    },
    BoxGeometry: function (a, b) {
        const T = Vector3.Subtract(a.center, b.center);
        let minOverlap = Infinity;
        let collisionAxis = null;

        const axesToTest = [
            a.axes[0], a.axes[1], a.axes[2],
            b.axes[0], b.axes[1], b.axes[2]
        ];

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const axis = a.axes[i].Cross(b.axes[j]);
                if (axis.sqrMagnitude >= 0.001) axesToTest.push(axis.normalized);
            }
        }

        for (let axis of axesToTest) {
            const overlap = BoxGeometry.GetOverlap(axis, T, a, b);
            if (overlap <= 0) return null;
            if (overlap < minOverlap) {
                minOverlap = overlap;
                collisionAxis = axis;
            }
        }

        let normal = collisionAxis;
        if (normal.Dot(T) < 0) normal = normal.Negate();
        normal = normal.Normalize();

        // Punkt styku na dynamicznym Boxie (a) wysunięty w stronę przeszkody
        const contactPoint = BoxGeometry.GetContactPoint(a, normal.Negate());

        return {
            point: contactPoint,
            normal: normal,
            overlap: minOverlap,
        };
    },
    CylinderGeometry: function (box, cyl) {
        // Rzutujemy środek boxa na oś cylindra
        const d = Vector3.Subtract(box.center, cyl.center);
        const distOnAxis = d.Dot(cyl.axis);
        const clampedDist = Math.max(-cyl.height / 2, Math.min(cyl.height / 2, distOnAxis));
        const pointOnAxis = cyl.center.Add(cyl.axis.Multiply(clampedDist));

        // Kierunek od osi cylindra do boxa
        const radialVec = Vector3.Subtract(box.center, pointOnAxis);
        const radialDist = radialVec.magnitude;
        const radialDir = radialDist > 0.001 ? radialVec.Divide(radialDist) : box.axes[0];

        // Przybliżamy cylinder jako Box (OBB) wyrównany do kierunku kolizji
        const tempBoxB = {
            center: pointOnAxis.Add(radialDir.Multiply(cyl.radius * 0.5)),
            extents: new Vector3(cyl.radius, cyl.height / 2, cyl.radius),
            axes: [radialDir, cyl.axis, radialDir.Cross(cyl.axis)]
        };

        return this.BoxGeometry(box, tempBoxB);
    },
    CapsuleGeometry: function (box, cap) {
        // Znajdujemy najbliższy punkt na szkielecie kapsuły
        const capsuleVec = Vector3.Subtract(cap.end, cap.start);
        const t = Math.max(0, Math.min(1, Vector3.Subtract(box.center, cap.start).Dot(capsuleVec) / capsuleVec.sqrMagnitude));
        const closestPointOnSegment = cap.start.Add(capsuleVec.Multiply(t));

        // Traktujemy to jako kolizję Box vs Sphere o promieniu kapsuły
        const tempSphere = {
            center: closestPointOnSegment,
            radius: cap.radius
        };

        return this.SphereGeometry(box, tempSphere);
    },
    TriangleGeometry: function (box, a, b, c) {
        // const triNormal = Vector3.Subtract(b, a).Cross(Vector3.Subtract(c, a)).Normalize();
        // const T = Vector3.Subtract(box.center, Vector3.Lerp(a, Vector3.Lerp(b, c, 0.5), 0.5));

        const closestOnTri = TriangleGeometry.ClosestPoint(box.center, a, b, c);
        const hit = Geometry.compute.BoxGeometry.SphereGeometry(box, { center: closestOnTri, radius: 0.01 });

        if (hit) {
            const dir = Vector3.Subtract(box.center, closestOnTri);
            hit.overlap = Math.max(0, box.extents.magnitude - dir.magnitude); // Uproszczone
        }

        return hit;
    },
    TriangleMeshGeometry: function (box, triangleMesh) {
        let bestHit = null;
        for (let i = 0; i < triangleMesh.triangles.length; i += 3) {
            const hit = this.TriangleGeometry(box, triangleMesh.vertices[triangleMesh.triangles[i]], triangleMesh.vertices[triangleMesh.triangles[i + 1]], triangleMesh.vertices[triangleMesh.triangles[i + 2]]);
            if (hit && (!bestHit || hit.overlap > bestHit.overlap)) bestHit = hit;
        }
        return bestHit;
    }
};