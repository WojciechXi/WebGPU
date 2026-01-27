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
    static Identity(out = null) {
        out = out || new this();
        out[0] = 0; out[1] = 0; out[2] = 0; out[3] = 1;
        return out;
    }

    MultiplyVector3(v) { return Quaternion.MultiplyVector3(this, v); }
    static MultiplyVector3(q, v, out = null) {
        out = out || new Vector3();

        const x = v[0], y = v[1], z = v[2];
        const qx = q[0], qy = q[1], qz = q[2], qw = q[3];

        // t = 2 * cross(q.xyz, v)
        const tx = 2 * (qy * z - qz * y);
        const ty = 2 * (qz * x - qx * z);
        const tz = 2 * (qx * y - qy * x);

        // v' = v + qw * t + cross(q.xyz, t)
        out[0] = x + qw * tx + (qy * tz - qz * ty);
        out[1] = y + qw * ty + (qz * tx - qx * tz);
        out[2] = z + qw * tz + (qx * ty - qy * tx);

        return out;
    }

    Inverse(out = this) { return Quaternion.Inverse(this, out); }
    static Inverse(q, out = null) {
        out = out || new Quaternion();

        const dot = q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w;
        out[0] = -q.x / dot;
        out[1] = -q.y / dot;
        out[2] = -q.z / dot;
        out[3] = -q.w / dot;

        return out;
    }

    // Quaternion multiplication (combines rotations)
    Multiply(b, out = this) {
        out = out || this.Clone();

        const ax = this[0], ay = this[1], az = this[2], aw = this[3];
        const bx = b[0], by = b[1], bz = b[2], bw = b[3];

        out[0] = ax * bw + aw * bx + ay * bz - az * by;
        out[1] = ay * bw + aw * by + az * bx - ax * bz;
        out[2] = az * bw + aw * bz + ax * by - ay * bx;
        out[3] = aw * bw - ax * bx - ay * by - az * bz;

        return out;
    }
    static Multiply(a, b, out = null) { return a.Multiply(b, out); }

    Normalize(out = this) {
        out = out || this.Clone();
        const mag = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        out.x = this.x / mag;
        out.y = this.y / mag;
        out.z = this.z / mag;
        out.w = this.w / mag;
        return out;
    }
    // Normalize quaternion
    static Normalize(q, out = null) { return q.Normalize(out); }

    // Create quaternion from axis and angle
    static FromAxisAngle(axis, angle, out = null) {
        out = out || new Quaternion();
        const half = Mathf.DegToRad(angle) * 0.5;
        const s = Mathf.Sin(half);
        out[0] = axis[0] * s;
        out[1] = axis[1] * s;
        out[2] = axis[2] * s;
        out[3] = Mathf.Cos(half);
        return Quaternion.Normalize(out, out);
    }

    // Convert quaternion to rotation matrix (4x4)
    static ToMatrix4(q, out = null) {
        out = out || new Matrix4x4();

        const x = q[0], y = q[1], z = q[2], w = q[3];
        const xx = x * x, yy = y * y, zz = z * z;
        const xy = x * y, xz = x * z, yz = y * z;
        const wx = w * x, wy = w * y, wz = w * z;

        out[0] = 1 - 2 * (yy + zz);
        out[1] = 2 * (xy + wz);
        out[2] = 2 * (xz - wy);
        out[3] = 0;

        out[4] = 2 * (xy - wz);
        out[5] = 1 - 2 * (xx + zz);
        out[6] = 2 * (yz + wx);
        out[7] = 0;

        out[8] = 2 * (xz + wy);
        out[9] = 2 * (yz - wx);
        out[10] = 1 - 2 * (xx + yy);
        out[11] = 0;

        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;

        return out;
    }

    // Spherical linear interpolation (slerp)
    static Slerp(a, b, t, out = null) {
        out = out || new Quaternion();

        let ax = a[0], ay = a[1], az = a[2], aw = a[3];
        let bx = b[0], by = b[1], bz = b[2], bw = b[3];

        // Dot product
        let cosHalfTheta = ax * bx + ay * by + az * bz + aw * bw;

        if (cosHalfTheta < 0) {
            bx = -bx; by = -by; bz = -bz; bw = -bw;
            cosHalfTheta = -cosHalfTheta;
        }

        if (cosHalfTheta > 0.9995) {
            out[0] = ax + t * (bx - ax);
            out[1] = ay + t * (by - ay);
            out[2] = az + t * (bz - az);
            out[3] = aw + t * (bw - aw);
            return Quaternion.Normalize(out, out);
        }

        const halfTheta = Mathf.Acos(cosHalfTheta);
        const sinHalfTheta = Mathf.Sqrt(1.0 - cosHalfTheta * cosHalfTheta);

        const ratioA = Mathf.Sin((1 - t) * halfTheta) / sinHalfTheta;
        const ratioB = Mathf.Sin(t * halfTheta) / sinHalfTheta;

        out[0] = ax * ratioA + bx * ratioB;
        out[1] = ay * ratioA + by * ratioB;
        out[2] = az * ratioA + bz * ratioB;
        out[3] = aw * ratioA + bw * ratioB;

        return out;
    }

    static Euler(x = 0, y = 0, z = 0, out = null) {
        out = out || new Quaternion();

        const radX = x * Mathf.PI / 360;
        const radY = y * Mathf.PI / 360;
        const radZ = z * Mathf.PI / 360;

        const cX = Math.cos(radX);
        const sX = Math.sin(radX);
        const cY = Math.cos(radY);
        const sY = Math.sin(radY);
        const cZ = Math.cos(radZ);
        const sZ = Math.sin(radZ);

        out.w = cX * cY * cZ + sX * sY * sZ;
        out.x = sX * cY * cZ + cX * sY * sZ;
        out.y = cX * sY * cZ - sX * cY * sZ;
        out.z = cX * cY * sZ - sX * sY * cZ;

        return out;
    }

    /**
     * Convert quaternion to Euler angles (in radians).
     * Order: Yaw (Z), Pitch (Y), Roll (X)
     */
    static ToEuler(q, out = null) {
        out = out || new Vector3();
        const x = q[0], y = q[1], z = q[2], w = q[3];

        // roll (X-axis rotation)
        const sinr_cosp = 2 * (w * x + y * z);
        const cosr_cosp = 1 - 2 * (x * x + y * y);
        out[0] = Mathf.Atan2(sinr_cosp, cosr_cosp);

        // pitch (Y-axis rotation)
        const sinp = 2 * (w * y - z * x);
        if (Mathf.Abs(sinp) >= 1) {
            out[1] = Mathf.Sign(sinp) * Mathf.PI / 2; // clamp to 90° if out of range
        } else {
            out[1] = Mathf.Asin(sinp);
        }

        // yaw (Z-axis rotation)
        const siny_cosp = 2 * (w * z + x * y);
        const cosy_cosp = 1 - 2 * (y * y + z * z);
        out[2] = Mathf.Atan2(siny_cosp, cosy_cosp);

        out[0] = Mathf.RadToDeg(out[0]);
        out[1] = Mathf.RadToDeg(out[1]);
        out[2] = Mathf.RadToDeg(out[2]);
        return out; // [roll, pitch, yaw]
    }

    static FromEuler(x, y, z, out = null) {
        out = out || Quaternion.identity;

        x = Mathf.DegToRad(x);
        y = Mathf.DegToRad(y);
        z = Mathf.DegToRad(z);

        const c1 = Mathf.Cos(z / 2), s1 = Mathf.Sin(z / 2);
        const c2 = Mathf.Cos(y / 2), s2 = Mathf.Sin(y / 2);
        const c3 = Mathf.Cos(x / 2), s3 = Mathf.Sin(x / 2);

        out.w = c1 * c2 * c3 + s1 * s2 * s3;
        out.x = c1 * c2 * s3 - s1 * s2 * c3;
        out.y = c1 * s2 * c3 + s1 * c2 * s3;
        out.z = s1 * c2 * c3 - c1 * s2 * s3;

        return out;
    }
}
