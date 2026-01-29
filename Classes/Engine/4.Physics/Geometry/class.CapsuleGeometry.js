class CapsuleGeometry {

    constructor(center1, center2, radius) {
        this.center1 = center1;
        this.center2 = center2;
        this.radius = radius;
    }

}

Geometry.check.CapsuleGeometry = {
    SphereGeometry: function (capsule, sphere) {
        return Geometry.check.SphereGeometry.CapsuleGeometry(sphere, capsule);
    },
    BoxGeometry: function (capsule, box) {
        return Geometry.check.BoxGeometry.CapsuleGeometry(box, capsule);
    },
    CapsuleGeometry: function (a, b) {
        // Test dystansu między dwoma odcinkami (szkieletami kapsuł)
        const capsuleVecA = Vector3.Subtract(a.center2, a.center1);
        const capsuleVecB = Vector3.Subtract(b.center2, b.center1);
        // Tutaj uproszczony test dystansu środków dla wydajności
        const centerA = Vector3.Lerp(a.center1, a.center2, 0.5);
        const centerB = Vector3.Lerp(b.center1, b.center2, 0.5);
        const maxDist = (capsuleVecA.magnitude + capsuleVecB.magnitude) * 0.5 + a.radius + b.radius;
        return Vector3.Distance(centerA, centerB) < maxDist;
    },
    CylinderGeometry: function (capsule, cylinder) {
        return Geometry.check.CylinderGeometry.CapsuleGeometry(cylinder, capsule);
    },
    TriangleGeometry: function (capsule, a, b, c) {
        const capsuleVec = Vector3.Subtract(capsule.end, capsule.start);
        const t = Mathf.Clamp(Vector3.Subtract(TriangleGeometry.ClosestPoint(capsule.start, a, b, c), capsule.start).Dot(capsuleVec) / capsuleVec.sqrMagnitude, 0, 1);
        const closestOnSegment = capsule.start.Add(capsuleVec.Multiply(t));

        const closestOnTri = TriangleGeometry.ClosestPoint(closestOnSegment, a, b, c);
        return Vector3.Distance(closestOnSegment, closestOnTri) < capsule.radius;
    },
    TriangleMeshGeometry: function (capsule, triangleMesh) {
        for (let i = 0; i < triangleMesh.triangles; i += 3) if (this.TriangleGeometry(capsule, triangleMesh.vertices[triangleMesh.triangles[i]], triangleMesh.vertices[triangleMesh.triangles[i + 1]], triangleMesh.vertices[triangleMesh.triangles[i + 2]])) return true;
        return false;
    },
};

Geometry.compute.CapsuleGeometry = {
    SphereGeometry: function (capsule, sphere) {
        const hit = Geometry.compute.SphereGeometry.CapsuleGeometry(sphere, capsule);
        if (!hit) return null;
        return {
            point: hit.point,
            normal: hit.normal.Negate(), // Wypychamy kapsułę
            overlap: hit.overlap
        };
    },
    BoxGeometry: function (capsule, box) {
        const hit = Geometry.compute.BoxGeometry.CapsuleGeometry(box, capsule);
        if (!hit) return null;
        return {
            point: hit.point,
            normal: hit.normal.Negate(), // Wypychamy kapsułę
            overlap: hit.overlap
        };
    },
    CapsuleGeometry: function (a, b) {
        // Algorytm: Najbliższe punkty na dwóch odcinkach (Line Segment vs Line Segment)
        const p1 = a.center1;
        const q1 = a.center2;
        const p2 = b.center1;
        const q2 = b.center2;

        const d1 = Vector3.Subtract(q1, p1); // Kierunek kapsuły A
        const d2 = Vector3.Subtract(q2, p2); // Kierunek kapsuły B
        const r = Vector3.Subtract(p1, p2);

        const a_val = d1.sqrMagnitude;
        const e = d2.sqrMagnitude;
        const f = d2.Dot(r);

        let s, t;
        const epsilon = 0.0001;

        if (a_val <= epsilon && e <= epsilon) {
            s = t = 0;
        } else if (a_val <= epsilon) {
            s = 0;
            t = Mathf.Clamp(f / e, 0, 1);
        } else {
            const c = d1.Dot(r);
            if (e <= epsilon) {
                t = 0;
                s = Mathf.Clamp(-c / a_val, 0, 1);
            } else {
                const b_val = d1.Dot(d2);
                const denom = a_val * e - b_val * b_val;
                if (denom !== 0) {
                    s = Mathf.Clamp((b_val * f - c * e) / denom, 0, 1);
                } else {
                    s = 0; // Odcinki równoległe
                }
                t = (b_val * s + f) / e;
                if (t < 0) {
                    t = 0;
                    s = Mathf.Clamp(-c / a_val, 0, 1);
                } else if (t > 1) {
                    t = 1;
                    s = Mathf.Clamp((b_val - c) / a_val, 0, 1);
                }
            }
        }

        const closestA = p1.Add(d1.Multiply(s));
        const closestB = p2.Add(d2.Multiply(t));

        const collisionVector = Vector3.Subtract(closestA, closestB);
        const dist = collisionVector.magnitude;
        const radiusSum = a.radius + b.radius;

        if (dist >= radiusSum) return null;

        const normal = dist > 0.001 ? collisionVector.Divide(dist) : new Vector3(0, 1, 0);

        return {
            point: closestB.Add(normal.Multiply(b.radius)),
            normal: normal,
            overlap: radiusSum - dist
        };
    },
    CylinderGeometry: function (capsule, cylinder) {
        const hit = Geometry.compute.CylinderGeometry.CapsuleGeometry(cylinder, capsule);
        if (!hit) return null;
        return {
            point: hit.point,
            normal: hit.normal.Negate(),
            overlap: hit.overlap
        };
    },
    TriangleGeometry: function (capsule, a, b, c) {
        const capsuleVec = Vector3.Subtract(capsule.end, capsule.start);
        // Próbkowanie punktów (start, środek, koniec) dla stabilności
        const points = [capsule.start, capsule.start.Add(capsuleVec.Multiply(0.5)), capsule.end];
        let bestHit = null;

        for (let p of points) {
            const hit = Geometry.compute.SphereGeometry.TriangleGeometry({ center: p, radius: capsule.radius }, a, b, c);
            if (hit && (!bestHit || hit.overlap > bestHit.overlap)) bestHit = hit;
        }
        return bestHit;
    },
    TriangleMeshGeometry: function (capsule, triangleMesh) {
        let bestHit = null;
        for (let i = 0; i < triangleMesh.triangles.length; i += 3) {
            const hit = this.TriangleGeometry(capsule, triangleMesh.vertices[triangleMesh.triangles[i]], triangleMesh.vertices[triangleMesh.triangles[i + 1]], triangleMesh.vertices[triangleMesh.triangles[i + 2]]);
            if (hit && (!bestHit || hit.overlap > bestHit.overlap)) bestHit = hit;
        }
        return bestHit;
    }
};