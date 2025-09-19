Math.Clamp = function (value, min, max) {
    return Math.min(Math.max(value, min), max);
};

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