Math.Clamp = function (value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
};

Math.InverseLerp = function (a, b, v) {
    if (a === b) return 0.0; // unikanie dzielenia przez zero
    return (v - a) / (b - a);
}

Math.Lerp = function (a, b, t) {
    return Math.Clamp(a + (b - a) * t, a, b);
};

Math.LerpUnclamped = function (a, b, t) {
    return a + (b - a) * t;
};

Math.DegToRad = function (deg) {
    return deg * Math.PI / 180;
};

Math.RadToDeg = function (rad) {
    return rad * 180 / Math.PI;
};