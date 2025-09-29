class PerlinNoise {

    constructor(seed = 0) {
        this.seed = seed | 0;
        this.perm = new Uint8Array(512);
        this._buildPermutation();
    }

    // ---------- PRNG do seedowania permutacji (LCG) ----------
    _randomIntGenerator(seed) {
        // prosty LCG, daje powtarzalne wartości
        let s = seed >>> 0;
        return function () {
            s = (1664525 * s + 1013904223) >>> 0;
            return s;
        };
    }

    _buildPermutation() {
        // początkowa tablica 0..255
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;

        // mieszanie z PRNG zależnym od seeda
        const rand = this._randomIntGenerator(this.seed);
        for (let i = 255; i > 0; i--) {
            const r = rand() % (i + 1);
            // swap
            const tmp = p[i];
            p[i] = p[r];
            p[r] = tmp;
        }

        // duplikujemy, zgodnie z klasyczną implementacją Perlin
        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
        }
    }

    // ---------- pomocnicze funkcje matematyczne ----------
    static fade(t) {
        // 6t^5 - 15t^4 + 10t^3
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    static lerp(a, b, t) {
        return a + t * (b - a);
    }

    // gradient dla 2D: wybieramy jedną z 8 możliwych kierunków
    _grad(hash, x, y) {
        switch (hash & 7) {
            case 0: return x + y;
            case 1: return -x + y;
            case 2: return x - y;
            case 3: return -x - y;
            case 4: return x;
            case 5: return -x;
            case 6: return y;
            case 7: return -y;
        }
    }

    // ---------- Perlin 2D ----------
    Noise(x, y) {
        // znajdź jednostkowy kwadrat, w którym leży punkt
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        // pozycja punktu wewnątrz jednostkowego kwadratu
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);

        // fade dla wygładzenia
        const u = PerlinNoise.fade(xf);
        const v = PerlinNoise.fade(yf);

        const p = this.perm;

        // hashe rogów
        const aa = p[X + p[Y]];
        const ab = p[X + p[Y + 1]];
        const ba = p[X + 1 + p[Y]];
        const bb = p[X + 1 + p[Y + 1]];

        // oblicz dot-product gradientów z wektorami do punktu
        const x1 = PerlinNoise.lerp(
            this._grad(aa, xf, yf),
            this._grad(ba, xf - 1, yf),
            u
        );

        const x2 = PerlinNoise.lerp(
            this._grad(ab, xf, yf - 1),
            this._grad(bb, xf - 1, yf - 1),
            u
        );

        // końcowe miksowanie w osi Y
        const result = PerlinNoise.lerp(x1, x2, v);

        // wynik zwykle w przybliżeniu w [-1,1]. Zwracamy go takim jakim jest.
        return result;
    }

    // ---------- Octaves (wielowarstwowy sumator) ----------
    NoiseOctave(x, y, octaves = 4, persistence = 0.5, lacunarity = 2) {
        let amplitude = 1;
        let frequency = 1;
        let sum = 0;
        let maxAmp = 0;

        for (let i = 0; i < octaves; i++) {
            sum += this.Noise(x * frequency, y * frequency) * amplitude;
            maxAmp += amplitude;

            amplitude *= persistence;
            frequency *= lacunarity;
        }

        // normalizacja do [-1,1] (przybliżona)
        return sum / maxAmp;
    }

}
