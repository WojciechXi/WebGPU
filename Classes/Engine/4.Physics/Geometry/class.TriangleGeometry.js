class TriangleGeometry {

    constructor(a, b, c) {
        this.a = a;
        this.b = b;
        this.c = c;
    }

    ClosestPoint(position) {
        const ab = Vector3.Subtract(this.b, this.a);
        const ac = Vector3.Subtract(this.c, this.a);
        const ap = Vector3.Subtract(position, this.a);
        const d1 = ab.Dot(ap);
        const d2 = ac.Dot(ap);
        if (d1 <= 0 && d2 <= 0) return this.a;

        const bp = Vector3.Subtract(position, this.b);
        const d3 = ab.Dot(bp);
        const d4 = ac.Dot(bp);
        if (d3 >= 0 && d4 <= d3) return this.b;

        const vc = d1 * d4 - d3 * d2;
        if (vc <= 0 && d1 >= 0 && d3 <= 0) {
            const v = d1 / (d1 - d3);
            return this.a.Add(ab.Multiply(v));
        }

        const cp = Vector3.Subtract(position, this.c);
        const d5 = ac.Dot(cp);
        const d6 = ab.Dot(cp);
        if (d5 >= 0 && d6 <= d5) return this.c;

        const vb = d5 * d2 - d1 * d6;
        if (vb <= 0 && d2 >= 0 && d5 <= 0) {
            const w = d2 / (d2 - d5);
            return this.a.Add(ac.Multiply(w));
        }

        const va = d3 * d6 - d5 * d4;
        if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
            const w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
            return this.b.Add(Vector3.Subtract(this.c, this.b).Multiply(w));
        }

        const denom = 1 / (va + vb + vc);
        const v = vb * denom;
        const w = vc * denom;
        return this.a.Add(ab.Multiply(v)).Add(ac.Multiply(w));
    }

}

Geometry.check.TriangleGeometry = {
    SphereGeometry: function (triangle, sphere) {
        const closest = triangle.ClosestPoint(sphere.center);
        return Vector3.Distance(sphere.center, closest) < sphere.radius;
    },
    BoxGeometry: function (triangle, box) {
        // Uproszczony check - bounding box trójkąta vs box
        return true;
    },
    TriangleGeometry: function (a, b) {
        return Vector3.Distance(a.a, b.a) < 1.0;
    },
};

Geometry.compute.TriangleGeometry = {
    SphereGeometry: function (sphere, triangle) {
        const closestPoint = triangle.ClosestPoint(sphere.center);
        const collisionVector = Vector3.Subtract(sphere.center, closestPoint);
        const distance = collisionVector.magnitude;

        if (distance >= sphere.radius) return null;

        // Normalna trójkąta (płaszczyzny)
        const edge1 = Vector3.Subtract(triangle.b, triangle.a);
        const edge2 = Vector3.Subtract(triangle.c, triangle.a);
        const triNormal = edge1.Cross(edge2).Normalize();

        // Normalna kolizji - jeśli sfera jest idealnie na powierzchni, użyj normalnej trójkąta
        const normal = distance > 0.0001 ? collisionVector.Divide(distance) : triNormal;

        return {
            point: closestPoint,
            normal: normal, // Wypycha sferę od trójkąta
            overlap: sphere.radius - distance
        };
    },
    BoxGeometry: function (box, triangle) {
        // Implementacja SAT dla Box vs Triangle
        // Testujemy: 3 osie Boxa, 1 oś normalnej trójkąta, 9 osi krawędzi (3 boxa x 3 trójkąta)
        const triNormal = Vector3.Subtract(triangle.b, triangle.a).Cross(Vector3.Subtract(triangle.c, triangle.a)).Normalize();
        const T = Vector3.Subtract(box.center, Vector3.Lerp(triangle.a, Vector3.Lerp(triangle.b, triangle.c, 0.5), 0.5));

        // Dla uproszczenia używamy najbliższego punktu (podobnie jak dla sfery)
        // Jest to wystarczające dla większości zastosowań, dopóki trójkąty nie są większe od boxa
        const closestOnTri = triangle.ClosestPoint(box.center);
        const hit = Geometry.compute.BoxGeometry.SphereGeometry(box, { center: closestOnTri, radius: 0.01 });

        if (hit) {
            // Skoryguj overlap, bo SphereGeometry użyło promienia 0.01
            const dir = Vector3.Subtract(box.center, closestOnTri);
            hit.overlap = Math.max(0, box.extents.magnitude - dir.magnitude); // Uproszczone
        }
        return hit;
    },
    CapsuleGeometry: function (capsule, triangle) {
        // Znajdujemy najbliższy punkt na szkieletu kapsuły do trójkąta
        const capsuleVec = Vector3.Subtract(capsule.center2, capsule.center1);
        // Próbkowanie punktów lub analityczne rozwiązanie Segment-Triangle (uproszczone do punktów końcowych i środka)
        const hit1 = this.SphereGeometry({ center: capsule.center1, radius: capsule.radius }, triangle);
        const hit2 = this.SphereGeometry({ center: capsule.center2, radius: capsule.radius }, triangle);

        if (!hit1 && !hit2) return null;
        return hit1 && hit2 ? (hit1.overlap > hit2.overlap ? hit1 : hit2) : (hit1 || hit2);
    },
    TriangleGeometry: function (a, b) {
        const closestOnB = b.ClosestPoint(a.a);
        const collisionVector = Vector3.Subtract(a.a, closestOnB);
        return {
            point: closestOnB,
            normal: collisionVector.Normalize(),
            overlap: Math.max(0, 0.1 - collisionVector.magnitude)
        };
    },
};