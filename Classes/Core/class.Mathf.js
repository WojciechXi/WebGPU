class Mathf {

    static get PI() { return Math.PI; }
    static get Epsilon() { return 1.401298e-45; }

    static get Deg2Rad() { return 0.017453292519943295; }
    static get Rad2Deg() { return 57.29577951308232; }

    static get Infinity() { return Infinity; }
    static get NegativeInfinity() { return -Infinity; }

    //Custom

    static DegToRad(deg) { return deg * Mathf.Deg2Rad; }
    static RadToDeg(rad) { return rad * Mathf.Rad2Deg; }

    static Random() { return Math.random(); }

    //Unity

    static Floor(x) { return Math.floor(x); }
    static FloorToInt(x) { return Math.floor(x); }

    static Round(x, decimals = 0) {
        const p = Math.pow(10, decimals);
        return Math.round(x * p) / p;
    }
    static RoundToInt(x) { return Math.round(x); }

    static Ceil(x) { return Math.ceil(x); }
    static CeilToInt(x) { return Math.ceil(x); }

    static Abs(x) { return Math.abs(x); }
    static Acos(x) { return Math.acos(x); }
    static Approximately() { }
    static Asin(x) { return Math.asin(x); }
    static Atan(x) { return Math.atan(x); }
    static Atan2(y, x) { return Math.atan2(y, x); }
    static Clamp(value, min, max) { return value < min ? min : (value > max ? max : value); }
    static Clamp01(value) { return value < 0 ? 0 : (value > 1 ? 1 : value); }
    static ClosestPowerOfTwo() { }
    static CorrelatedColorTemperatureToRGB() { }
    static Cos(x) { return Math.cos(x); }
    static DeltaAngle() { }
    static Exp(x) { return Math.exp(x); }
    static FloatToHalf() { }
    static GammaToLinearSpace() { }
    static HalfToFloat() { }
    static InverseLerp(a, b, v) { return a === b ? 0 : (v - a) / (b - a); }
    static IsPowerOfTwo() { }
    static Lerp(a, b, t) { return Mathf.Clamp(a + (b - a) * t, a, b); }
    static LerpUnclamped(a, b, t) { return a + (b - a) * t; }
    static LinearToGammaSpace() { }
    static Log(x) { return Math.log(x); }
    static Log10(x) { return Math.log10(x); }
    static Max(...values) { return Math.max(...values); }
    static Min(...values) { return Math.min(...values); }
    static MoveTowards() { }
    static MoveTowardsAngle() { }
    static NextPowerOfTwo() { }
    static PerlinNoise() { }
    static PerlinNoise1D() { }
    static PingPong() { }
    static Pow(x, y) { return Math.pow(x, y); }
    static Repeat() { }
    static Sign(x) { return Math.sign(x); }
    static Sin(x) { return Math.sin(x); }
    static SmoothDamp() { }
    static SmoothDampAngle() { }
    static SmoothStep() { }
    static Sqrt(x) { return Math.sqrt(x); }
    static Tan(x) { return Math.tan(x); }

}