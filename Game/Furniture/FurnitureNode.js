class FurnitureNode {

    constructor(axis, ratio = 0.5) {
        this.axis = axis;
        this.ratio = ratio;
        this.children = [];
        this.divider = null;
    }

    get isLeaf() {
        return this.children.length === 0;
    }

    Split(axis, ratio = 0.5) {
        if (!this.isLeaf) return this.children;

        this.axis = axis.toLowerCase();
        this.ratio = Math.max(0.01, Math.min(0.99, ratio));

        return this.children = [new FurnitureNode(), new FurnitureNode()];
    }

    Build(bodyTriangles, addBox, min, max, thickness) {
        if (this.isLeaf) return;

        const ax = this.axis;
        const t = thickness;
        const parentSize = max[ax] - min[ax];

        if (parentSize <= t) return;

        const center = min[ax] + parentSize * this.ratio;
        const halfT = t / 2;

        const plateMin = min.Clone();
        const plateMax = max.Clone();

        plateMin[ax] = center - halfT;
        plateMax[ax] = center + halfT;

        bodyTriangles.push(...addBox(plateMin, plateMax));

        const childAMin = min.Clone();
        const childAMax = max.Clone();
        childAMax[ax] = center - halfT;

        const childBMin = min.Clone();
        const childBMax = max.Clone();
        childBMin[ax] = center + halfT;

        // 4. Wywołanie rekurencyjne dla dzieci
        this.children[0].Build(bodyTriangles, addBox, childAMin, childAMax, thickness);
        this.children[1].Build(bodyTriangles, addBox, childBMin, childBMax, thickness);
    }

    Raycast(ray, bounds, defaultThickness) {
        const min = bounds.min;
        const max = bounds.max;

        if (this.isLeaf) {
            const hitDistance = bounds.IntersectRay(ray);
            if (hitDistance !== null && hitDistance !== false) {
                return { node: this, hitDistance, bounds };
            }
            return null;
        }

        const ax = this.axis;
        const t = this.thickness ?? defaultThickness;
        const parentSize = max[ax] - min[ax];

        const center = min[ax] + parentSize * this.ratio;
        const halfT = t / 2;

        const childAMin = min.Clone();
        const childAMax = max.Clone();
        childAMax[ax] = center - halfT;

        const childBMin = min.Clone();
        const childBMax = max.Clone();
        childBMin[ax] = center + halfT;

        const boundsA = new Bounds(
            new Vector3((childAMin.x + childAMax.x) * 0.5, (childAMin.y + childAMax.y) * 0.5, (childAMin.z + childAMax.z) * 0.5),
            new Vector3(childAMax.x - childAMin.x, childAMax.y - childAMin.y, childAMax.z - childAMin.z)
        );

        const boundsB = new Bounds(
            new Vector3((childBMin.x + childBMax.x) * 0.5, (childBMin.y + childBMax.y) * 0.5, (childBMin.z + childBMax.z) * 0.5),
            new Vector3(childBMax.x - childBMin.x, childBMax.y - childBMin.y, childBMax.z - childBMin.z)
        );

        if (boundsA.IntersectRay(ray)) return this.children[0].Raycast(ray, boundsA, defaultThickness);
        if (boundsB.IntersectRay(ray)) return this.children[1].Raycast(ray, boundsB, defaultThickness);

        return null;
    }

}