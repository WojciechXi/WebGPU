class Quaternion extends Float32Array {

    static get identity() { return new this(0, 0, 0, 1); }

    constructor(x = 0, y = 0, z = 0, w = 1) {
        super(4);
        this[0] = x; // x
        this[1] = y; // y
        this[2] = z; // z
        this[3] = w; // w
    }

    get x() { return this[0]; } set x(f) { return this[0] = f; }
    get y() { return this[1]; } set y(f) { return this[1] = f; }
    get z() { return this[2]; } set z(f) { return this[2] = f; }
    get w() { return this[3]; } set w(f) { return this[3] = f; }

    Clone() {
        return new Quaternion(this[0], this[1], this[2], this[3]);
    }

    // Identity quaternion (no rotation)
    static Identity(dst = null) {
        dst = dst || new this();
        dst[0] = 0; dst[1] = 0; dst[2] = 0; dst[3] = 1;
        return dst;
    }

    MultiplyVector3(v) { return Quaternion.MultiplyVector3(this, v); }
    static MultiplyVector3(q, v, dst = null) {
        dst = dst || new Vector3();

        const x = v[0], y = v[1], z = v[2];
        const qx = q[0], qy = q[1], qz = q[2], qw = q[3];

        // t = 2 * cross(q.xyz, v)
        const tx = 2 * (qy * z - qz * y);
        const ty = 2 * (qz * x - qx * z);
        const tz = 2 * (qx * y - qy * x);

        // v' = v + qw * t + cross(q.xyz, t)
        dst[0] = x + qw * tx + (qy * tz - qz * ty);
        dst[1] = y + qw * ty + (qz * tx - qx * tz);
        dst[2] = z + qw * tz + (qx * ty - qy * tx);

        return dst;
    }

    Inverse(dst = this) { return Quaternion.Inverse(this, dst); }
    static Inverse(q, dst = null) {
        dst = dst || new Quaternion();

        const dot = q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w;
        dst[0] = -q.x / dot;
        dst[1] = -q.y / dot;
        dst[2] = -q.z / dot;
        dst[3] = -q.w / dot;

        return dst;
    }

    // Quaternion multiplication (combines rotations)
    Multiply(b) {
        return Quaternion.Multiply(this, b, this);
    }
    static Multiply(a, b, dst = null) {
        dst = dst || new Quaternion();

        const ax = a[0], ay = a[1], az = a[2], aw = a[3];
        const bx = b[0], by = b[1], bz = b[2], bw = b[3];

        dst[0] = ax * bw + aw * bx + ay * bz - az * by;
        dst[1] = ay * bw + aw * by + az * bx - ax * bz;
        dst[2] = az * bw + aw * bz + ax * by - ay * bx;
        dst[3] = aw * bw - ax * bx - ay * by - az * bz;

        return dst;
    }

    // Normalize quaternion
    static Normalize(q, dst = null) {
        dst = dst || new Quaternion();
        const x = q[0], y = q[1], z = q[2], w = q[3];
        let len = Mathf.hypot(x, y, z, w);
        if (len > 0.00001) {
            len = 1 / len;
            dst[0] = x * len;
            dst[1] = y * len;
            dst[2] = z * len;
            dst[3] = w * len;
        } else {
            return Quaternion.Identity(dst);
        }
        return dst;
    }

    // Create quaternion from axis and angle
    static FromAxisAngle(axis, angle, dst = null) {
        dst = dst || new Quaternion();
        const half = Mathf.DegToRad(angle) * 0.5;
        const s = Mathf.Sin(half);
        dst[0] = axis[0] * s;
        dst[1] = axis[1] * s;
        dst[2] = axis[2] * s;
        dst[3] = Mathf.Cos(half);
        return Quaternion.Normalize(dst, dst);
    }

    // Convert quaternion to rotation matrix (4x4)
    static ToMatrix4(q, dst = null) {
        dst = dst || new Matrix4x4();

        const x = q[0], y = q[1], z = q[2], w = q[3];
        const xx = x * x, yy = y * y, zz = z * z;
        const xy = x * y, xz = x * z, yz = y * z;
        const wx = w * x, wy = w * y, wz = w * z;

        dst[0] = 1 - 2 * (yy + zz);
        dst[1] = 2 * (xy + wz);
        dst[2] = 2 * (xz - wy);
        dst[3] = 0;

        dst[4] = 2 * (xy - wz);
        dst[5] = 1 - 2 * (xx + zz);
        dst[6] = 2 * (yz + wx);
        dst[7] = 0;

        dst[8] = 2 * (xz + wy);
        dst[9] = 2 * (yz - wx);
        dst[10] = 1 - 2 * (xx + yy);
        dst[11] = 0;

        dst[12] = 0;
        dst[13] = 0;
        dst[14] = 0;
        dst[15] = 1;

        return dst;
    }

    // Spherical linear interpolation (slerp)
    static Slerp(a, b, t, dst = null) {
        dst = dst || new Quaternion();

        let ax = a[0], ay = a[1], az = a[2], aw = a[3];
        let bx = b[0], by = b[1], bz = b[2], bw = b[3];

        // Dot product
        let cosHalfTheta = ax * bx + ay * by + az * bz + aw * bw;

        if (cosHalfTheta < 0) {
            bx = -bx; by = -by; bz = -bz; bw = -bw;
            cosHalfTheta = -cosHalfTheta;
        }

        if (cosHalfTheta > 0.9995) {
            dst[0] = ax + t * (bx - ax);
            dst[1] = ay + t * (by - ay);
            dst[2] = az + t * (bz - az);
            dst[3] = aw + t * (bw - aw);
            return Quaternion.Normalize(dst, dst);
        }

        const halfTheta = Mathf.Acos(cosHalfTheta);
        const sinHalfTheta = Mathf.Sqrt(1.0 - cosHalfTheta * cosHalfTheta);

        const ratioA = Mathf.Sin((1 - t) * halfTheta) / sinHalfTheta;
        const ratioB = Mathf.Sin(t * halfTheta) / sinHalfTheta;

        dst[0] = ax * ratioA + bx * ratioB;
        dst[1] = ay * ratioA + by * ratioB;
        dst[2] = az * ratioA + bz * ratioB;
        dst[3] = aw * ratioA + bw * ratioB;

        return dst;
    }

    /**
     * Convert quaternion to Euler angles (in radians).
     * Order: Yaw (Z), Pitch (Y), Roll (X)
     */
    static ToEuler(q, dst = null) {
        dst = dst || new Vector3();
        const x = q[0], y = q[1], z = q[2], w = q[3];

        // roll (X-axis rotation)
        const sinr_cosp = 2 * (w * x + y * z);
        const cosr_cosp = 1 - 2 * (x * x + y * y);
        dst[0] = Mathf.Atan2(sinr_cosp, cosr_cosp);

        // pitch (Y-axis rotation)
        const sinp = 2 * (w * y - z * x);
        if (Mathf.Abs(sinp) >= 1) {
            dst[1] = Mathf.Sign(sinp) * Mathf.PI / 2; // clamp to 90° if out of range
        } else {
            dst[1] = Mathf.Asin(sinp);
        }

        // yaw (Z-axis rotation)
        const siny_cosp = 2 * (w * z + x * y);
        const cosy_cosp = 1 - 2 * (y * y + z * z);
        dst[2] = Mathf.Atan2(siny_cosp, cosy_cosp);

        dst[0] = Mathf.RadToDeg(dst[0]);
        dst[1] = Mathf.RadToDeg(dst[1]);
        dst[2] = Mathf.RadToDeg(dst[2]);
        return dst; // [roll, pitch, yaw]
    }

    static FromEuler(x, y, z, dst = null) {
        dst = dst || Quaternion.identity;

        x = Mathf.DegToRad(x);
        y = Mathf.DegToRad(y);
        z = Mathf.DegToRad(z);

        const c1 = Mathf.Cos(z / 2), s1 = Mathf.Sin(z / 2);
        const c2 = Mathf.Cos(y / 2), s2 = Mathf.Sin(y / 2);
        const c3 = Mathf.Cos(x / 2), s3 = Mathf.Sin(x / 2);

        dst.w = c1 * c2 * c3 + s1 * s2 * s3;
        dst.x = c1 * c2 * s3 - s1 * s2 * c3;
        dst.y = c1 * s2 * c3 + s1 * c2 * s3;
        dst.z = s1 * c2 * c3 - c1 * s2 * s3;

        return dst;
    }
}
