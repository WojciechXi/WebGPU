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

    static LookRotation(forward, upwards = Vector3.up, out = null) {
        out = out || new this();

        forward = forward.normalized;

        let right = upwards.Cross(forward).Normalize();
        let realUp = forward.Cross(right);

        let m00 = right.x, m01 = realUp.x, m02 = forward.x;
        let m10 = right.y, m11 = realUp.y, m12 = forward.y;
        let m20 = right.z, m21 = realUp.z, m22 = forward.z;

        let t = m00 + m11 + m22;

        if (t > 0) {
            let s = Mathf.Sqrt(t + 1.0) * 2;
            out.w = 0.25 * s;
            out.x = (m21 - m12) / s;
            out.y = (m02 - m20) / s;
            out.z = (m10 - m01) / s;
        } else if (m00 > m11 && m00 > m22) {
            let s = Mathf.Sqrt(1.0 + m00 - m11 - m22) * 2;
            out.w = (m21 - m12) / s;
            out.x = 0.25 * s;
            out.y = (m01 + m10) / s;
            out.z = (m02 + m20) / s;
        } else if (m11 > m22) {
            let s = Mathf.Sqrt(1.0 + m11 - m00 - m22) * 2;
            out.w = (m02 - m20) / s;
            out.x = (m01 + m10) / s;
            out.y = 0.25 * s;
            out.z = (m12 + m21) / s;
        } else {
            let s = Mathf.Sqrt(1.0 + m22 - m00 - m11) * 2;
            out.w = (m10 - m01) / s;
            out.x = (m02 + m20) / s;
            out.y = (m12 + m21) / s;
            out.z = 0.25 * s;
        }

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
        const mag = Mathf.Sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
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

        // Konwersja stopni na radiany i dzielenie przez 2
        const radX = x * (Math.PI / 360);
        const radY = y * (Math.PI / 360);
        const radZ = z * (Math.PI / 360);

        const sx = Math.sin(radX);
        const cx = Math.cos(radX);
        const sy = Math.sin(radY);
        const cy = Math.cos(radY);
        const sz = Math.sin(radZ);
        const cz = Math.cos(radZ);

        // Dla kolejności YXZ (najstabilniejsza w Y-up):
        out.x = sx * cy * cz + cx * sy * sz;
        out.y = cx * sy * cz - sx * cy * sz;
        out.z = cx * cy * sz - sx * sy * cz;
        out.w = cx * cy * cz + sx * sy * sz;

        return out;
    }

    static ToEuler(q, out = null) {
        out = out || new Vector3();
        const [x, y, z, w] = q;

        // Pitch (X-axis)
        const sinp = 2 * (w * x - y * z);
        if (Math.abs(sinp) >= 1)
            out[0] = (Math.PI / 2) * Math.sign(sinp);
        else
            out[0] = Math.asin(sinp);

        // Yaw (Y-axis)
        out[1] = Math.atan2(2 * (w * y + z * x), 1 - 2 * (x * x + y * y));

        // Roll (Z-axis)
        out[2] = Math.atan2(2 * (w * z + x * y), 1 - 2 * (z * z + x * x));

        out[0] = Mathf.RadToDeg(out[0]);
        out[1] = Mathf.RadToDeg(out[1]);
        out[2] = Mathf.RadToDeg(out[2]);
        return out;
    }
}
