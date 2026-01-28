class Geometry {

    static {
        this.check = {};
        this.compute = {};
    }

    static Check(a, b) {
        if (!a || !b) return false;
        if (this.check[a.constructor.name] && this.check[a.constructor.name][b.constructor.name]) return this.check[a.constructor.name][b.constructor.name](a, b);
        if (this.check[b.constructor.name] && this.check[b.constructor.name][a.constructor.name]) return this.check[b.constructor.name][a.constructor.name](b, a);
        return false;
    }

    static Compute(a, b) {
        if (!a || !b) return false;
        if (this.compute[a.constructor.name] && this.compute[a.constructor.name][b.constructor.name]) return this.compute[a.constructor.name][b.constructor.name](a, b);
        if (this.compute[b.constructor.name] && this.compute[b.constructor.name][a.constructor.name]) return this.compute[b.constructor.name][a.constructor.name](b, a);
        return false;
    }

}