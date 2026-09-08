class Matrix3x3 extends Float32Array {

    constructor() {
        super(9);
        Matrix3x3.Identity(this);
    }

    get m00() { return this[0]; } set m00(v) { this[0] = v; }
    get m10() { return this[1]; } set m10(v) { this[1] = v; }
    get m20() { return this[2]; } set m20(v) { this[2] = v; }
    get m01() { return this[3]; } set m01(v) { this[3] = v; }
    get m11() { return this[4]; } set m11(v) { this[4] = v; }
    get m21() { return this[5]; } set m21(v) { this[5] = v; }
    get m02() { return this[6]; } set m02(v) { this[6] = v; }
    get m12() { return this[7]; } set m12(v) { this[7] = v; }
    get m22() { return this[8]; } set m22(v) { this[8] = v; }

    static Identity(dst = null) {
        dst = dst || new Matrix3x3();
        dst[0] = 1; dst[1] = 0; dst[2] = 0;
        dst[3] = 0; dst[4] = 1; dst[5] = 0;
        dst[6] = 0; dst[7] = 0; dst[8] = 1;
        return dst;
    }

    Set(
        m00, m10, m20,
        m01, m11, m21,
        m02, m12, m22
    ) {
        this[0] = m00; this[1] = m10; this[2] = m20;
        this[3] = m01; this[4] = m11; this[5] = m21;
        this[6] = m02; this[7] = m12; this[8] = m22;
        return this;
    }



    static RotationX(angleDegrees, dst = null) {
        dst = dst || new Matrix3x3();
        const rad = angleDegrees * (Math.PI / 180);
        const c = Math.cos(rad);
        const s = Math.sin(rad);

        dst[0] = 1; dst[1] = 0; dst[2] = 0;
        dst[3] = 0; dst[4] = c; dst[5] = s;
        dst[6] = 0; dst[7] = -s; dst[8] = c;
        return dst;
    }

    static RotationY(angleDegrees, dst = null) {
        dst = dst || new Matrix3x3();
        const rad = angleDegrees * (Math.PI / 180);
        const c = Math.cos(rad);
        const s = Math.sin(rad);

        dst[0] = c; dst[1] = 0; dst[2] = s;
        dst[3] = 0; dst[4] = 1; dst[5] = 0;
        dst[6] = -s; dst[7] = 0; dst[8] = c;
        return dst;
    }

    static RotationZ(angleDegrees, dst = null) {
        dst = dst || new Matrix3x3();
        const rad = angleDegrees * (Math.PI / 180);
        const c = Math.cos(rad);
        const s = Math.sin(rad);

        dst[0] = c; dst[1] = s; dst[2] = 0;
        dst[3] = -s; dst[4] = c; dst[5] = 0;
        dst[6] = 0; dst[7] = 0; dst[8] = 1;
        return dst;
    }

    static Scaling([sx, sy, sz], dst = null) {
        dst = dst || new Matrix3x3();
        dst[0] = sx; dst[1] = 0; dst[2] = 0;
        dst[3] = 0; dst[4] = sy; dst[5] = 0;
        dst[6] = 0; dst[7] = 0; dst[8] = sz;
        return dst;
    }



    static FromQuaternion(q, dst = null) {
        dst = dst || new Matrix3x3();
        const x = q[0], y = q[1], z = q[2], w = q[3];

        const xx = x * x, yy = y * y, zz = z * z;
        const xy = x * y, xz = x * z, yz = y * z;
        const wx = w * x, wy = w * y, wz = w * z;

        dst[0] = 1 - 2 * (yy + zz);
        dst[1] = 2 * (xy + wz);
        dst[2] = 2 * (xz - wy);

        dst[3] = 2 * (xy - wz);
        dst[4] = 1 - 2 * (xx + zz);
        dst[5] = 2 * (yz + wx);

        dst[6] = 2 * (xz + wy);
        dst[7] = 2 * (yz - wx);
        dst[8] = 1 - 2 * (xx + yy);

        return dst;
    }

    static ToQuaternion(m, out = null) {
        out = out || new Quaternion();
        const trace = m[0] + m[4] + m[8];

        if (trace > 0) {
            const s = Math.sqrt(trace + 1.0) * 2;
            out[3] = 0.25 * s;
            out[0] = (m[5] - m[7]) / s;
            out[1] = (m[6] - m[2]) / s;
            out[2] = (m[1] - m[3]) / s;
        } else if ((m[0] > m[4]) && (m[0] > m[8])) {
            const s = Math.sqrt(1.0 + m[0] - m[4] - m[8]) * 2;
            out[3] = (m[5] - m[7]) / s;
            out[0] = 0.25 * s;
            out[1] = (m[1] + m[3]) / s;
            out[2] = (m[2] + m[6]) / s;
        } else if (m[4] > m[8]) {
            const s = Math.sqrt(1.0 + m[4] - m[0] - m[8]) * 2;
            out[3] = (m[6] - m[2]) / s;
            out[0] = (m[1] + m[3]) / s;
            out[1] = 0.25 * s;
            out[2] = (m[5] + m[7]) / s;
        } else {
            const s = Math.sqrt(1.0 + m[8] - m[0] - m[4]) * 2;
            out[3] = (m[1] - m[3]) / s;
            out[0] = (m[2] + m[6]) / s;
            out[1] = (m[5] + m[7]) / s;
            out[2] = 0.25 * s;
        }

        return out;
    }

    static FromMatrix4x4(m4, dst = null) {
        dst = dst || new Matrix3x3();
        dst[0] = m4[0]; dst[1] = m4[1]; dst[2] = m4[2];
        dst[3] = m4[4]; dst[4] = m4[5]; dst[5] = m4[6];
        dst[6] = m4[8]; dst[7] = m4[9]; dst[8] = m4[10];
        return dst;
    }



    static Multiply(a, b, dst = null) {
        dst = dst || new Matrix3x3();

        const a00 = a[0], a10 = a[1], a20 = a[2];
        const a01 = a[3], a11 = a[4], a21 = a[5];
        const a02 = a[6], a12 = a[7], a22 = a[8];

        const b00 = b[0], b10 = b[1], b20 = b[2];
        const b01 = b[3], b11 = b[4], b21 = b[5];
        const b02 = b[6], b12 = b[7], b22 = b[8];

        dst[0] = b00 * a00 + b01 * a10 + b02 * a20;
        dst[1] = b00 * a01 + b01 * a11 + b02 * a21;
        dst[2] = b00 * a02 + b01 * a12 + b02 * a22;

        dst[3] = b10 * a00 + b11 * a10 + b12 * a20;
        dst[4] = b10 * a01 + b11 * a11 + b12 * a21;
        dst[5] = b10 * a02 + b11 * a12 + b12 * a22;

        dst[6] = b20 * a00 + b21 * a10 + b22 * a20;
        dst[7] = b20 * a01 + b21 * a11 + b22 * a21;
        dst[8] = b20 * a02 + b21 * a12 + b22 * a22;

        return dst;
    }

    static MultiplyVector3(m, v, dst = null) {
        dst = dst || new Vector3();
        const x = v[0], y = v[1], z = v[2];

        dst[0] = m[0] * x + m[3] * y + m[6] * z;
        dst[1] = m[1] * x + m[4] * y + m[7] * z;
        dst[2] = m[2] * x + m[5] * y + m[8] * z;

        return dst;
    }

    static Transpose(m, dst = null) {
        dst = dst || new Matrix3x3();
        const m01 = m[3], m02 = m[6], m12 = m[7];

        dst[0] = m[0];
        dst[1] = m01;
        dst[2] = m02;

        dst[3] = m[1];
        dst[4] = m[4];
        dst[5] = m12;

        dst[6] = m[2];
        dst[7] = m[5];
        dst[8] = m[8];

        return dst;
    }

    static Inverse(m, dst = null) {
        dst = dst || new Matrix3x3();

        const m00 = m[0], m10 = m[1], m20 = m[2];
        const m01 = m[3], m11 = m[4], m21 = m[5];
        const m02 = m[6], m12 = m[7], m22 = m[8];

        const c00 = m11 * m22 - m12 * m21;
        const c01 = m12 * m20 - m10 * m22;
        const c02 = m10 * m21 - m11 * m20;

        const det = m00 * c00 + m01 * c01 + m02 * c02;

        if (det === 0) return Matrix3x3.Identity(dst);

        const invDet = 1.0 / det;

        dst[0] = c00 * invDet;
        dst[1] = c01 * invDet;
        dst[2] = c02 * invDet;

        dst[3] = (m02 * m21 - m01 * m22) * invDet;
        dst[4] = (m00 * m22 - m02 * m20) * invDet;
        dst[5] = (m01 * m20 - m00 * m21) * invDet;

        dst[6] = (m01 * m12 - m02 * m11) * invDet;
        dst[7] = (m02 * m10 - m00 * m12) * invDet;
        dst[8] = (m00 * m11 - m01 * m10) * invDet;

        return dst;
    }
}