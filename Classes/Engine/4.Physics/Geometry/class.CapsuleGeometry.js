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
    TriangleGeometry: function (capsule, triangle) {
        return Geometry.check.TriangleGeometry.CapsuleGeometry(capsule, triangle);
    },
    TriangleMeshGeometry: function (capsule, mesh) {
        return Geometry.check.TriangleMeshGeometry.CapsuleGeometry(mesh, capsule);
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
        const capsuleVec = Vector3.Subtract(capsule.center2, capsule.center1);

        const hit1 = SphereGeometry.compute.TriangleGeometry({ center: capsule.center1, radius: capsule.radius }, a, b, c);
        const hit2 = SphereGeometry.compute.TriangleGeometry({ center: capsule.center2, radius: capsule.radius }, a, b, c);

        if (!hit1 && !hit2) return null;
        return hit1 && hit2 ? (hit1.overlap > hit2.overlap ? hit1 : hit2) : (hit1 || hit2);
    },
    TriangleMeshGeometry: function (capsule, mesh) {
        return Geometry.compute.TriangleMeshGeometry.CapsuleGeometry(mesh, capsule);
    },
};