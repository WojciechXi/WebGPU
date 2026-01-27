class Sphere {

    constructor(center, radius) {
        this.center = center;
        this.radius = radius;
    }

    Check(sphere) {
        const d = Vector3.Sub(sphere.center, this.center);
        const radiusSum = this.radius + sphere.radius;
        return d.sqrMagnitude < (radiusSum * radiusSum);
    }

    ComputePenetration(sphere) {
        const collisionVector = Vector3.Sub(sphere.center, this.center);
        const distance = collisionVector.magnitude;
        const radiusSum = this.radius + sphere.radius;

        if (distance >= radiusSum) return null;

        // Normalna wskazuje od S1 do S2
        // Jeśli środki są identyczne (dist = 0), wybieramy dowolny kierunek (np. Vector3.Up)
        const normal = distance > 0.0001 ? Vector3.Divide(collisionVector, distance) : new Vector3(0, 1, 0);
        const overlap = radiusSum - distance;

        // Punkt styku leży na powierzchni styku obu kul
        const contactPoint = this.center.Add(Vector3.Multiply(normal, this.radius - (overlap * 0.5)));

        return {
            normal: normal.Normalize(),
            overlap: overlap,
            point: contactPoint
        };
    }

}