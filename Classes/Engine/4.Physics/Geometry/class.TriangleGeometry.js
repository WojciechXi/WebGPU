class TriangleGeometry {

    static ClosestPoint(position, a, b, c) {
        const ab = Vector3.Subtract(b, a);
        const ac = Vector3.Subtract(c, a);
        const ap = Vector3.Subtract(position, a);
        const d1 = ab.Dot(ap);
        const d2 = ac.Dot(ap);
        if (d1 <= 0 && d2 <= 0) return a;

        const bp = Vector3.Subtract(position, b);
        const d3 = ab.Dot(bp);
        const d4 = ac.Dot(bp);
        if (d3 >= 0 && d4 <= d3) return b;

        const vc = d1 * d4 - d3 * d2;
        if (vc <= 0 && d1 >= 0 && d3 <= 0) {
            const v = d1 / (d1 - d3);
            return a.Add(ab.Multiply(v));
        }

        const cp = Vector3.Subtract(position, c);
        const d5 = ac.Dot(cp);
        const d6 = ab.Dot(cp);
        if (d5 >= 0 && d6 <= d5) return c;

        const vb = d5 * d2 - d1 * d6;
        if (vb <= 0 && d2 >= 0 && d5 <= 0) {
            const w = d2 / (d2 - d5);
            return a.Add(ac.Multiply(w));
        }

        const va = d3 * d6 - d5 * d4;
        if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
            const w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
            return b.Add(Vector3.Subtract(c, b).Multiply(w));
        }

        const denom = 1 / (va + vb + vc);
        const v = vb * denom;
        const w = vc * denom;
        return a.Add(ab.Multiply(v)).Add(ac.Multiply(w));
    }

}