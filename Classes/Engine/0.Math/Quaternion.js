class Quaternion extends Float32Array {

    static get identity() { return new this(0, 0, 0, 1); }

    constructor(x = 0, y = 0, z = 0, w = 1) {
        super(4);
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this[3] = w;
    }

    get x() { return this[0]; } set x(f) { this[0] = f; }
    get y() { return this[1]; } set y(f) { this[1] = f; }
    get z() { return this[2]; } set z(f) { this[2] = f; }
    get w() { return this[3]; } set w(f) { this[3] = f; }

    Clone() {
        return new Quaternion(this[0], this[1], this[2], this[3]);
    }

    Set(x, y, z, w) {
        this[0] = x; this[1] = y; this[2] = z; this[3] = w;
        return this;
    }

    static Identity(out = null) {
        out = out || new this();
        out[0] = 0; out[1] = 0; out[2] = 0; out[3] = 1;
        return out;
    }

    Multiply(b, out = this) {
        const ax = this[0], ay = this[1], az = this[2], aw = this[3];
        const bx = b[0], by = b[1], bz = b[2], bw = b[3];

        out[0] = ax * bw + aw * bx + ay * bz - az * by;
        out[1] = ay * bw + aw * by + az * bx - ax * bz;
        out[2] = az * bw + aw * bz + ax * by - ay * bx;
        out[3] = aw * bw - ax * bx - ay * by - az * bz;

        return out;
    }
    static Multiply(a, b, out = null) {
        out = out || new Quaternion();
        return a.Multiply(b, out);
    }

    MultiplyVector3(v, out = null) { return Quaternion.MultiplyVector3(this, v, out); }
    static MultiplyVector3(q, v, out = null) {
        out = out || new Vector3();

        const x = v[0], y = v[1], z = v[2];
        const qx = q[0], qy = q[1], qz = q[2], qw = q[3];

        const tx = 2 * (qy * z - qz * y);
        const ty = 2 * (qz * x - qx * z);
        const tz = 2 * (qx * y - qy * x);

        out[0] = x + qw * tx + (qy * tz - qz * ty);
        out[1] = y + qw * ty + (qz * tx - qx * tz);
        out[2] = z + qw * tz + (qx * ty - qy * tx);

        return out;
    }

    Normalize(out = this) {
        const mag = Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2] + this[3] * this[3]);
        if (mag > 0) {
            const invMag = 1.0 / mag;
            this[0] *= invMag;
            this[1] *= invMag;
            this[2] *= invMag;
            this[3] *= invMag;
        }
        if (out !== this) {
            out[0] = this[0]; out[1] = this[1]; out[2] = this[2]; out[3] = this[3];
        }
        return out;
    }
    static Normalize(q, out = null) {
        out = out || new Quaternion();
        out[0] = q[0]; out[1] = q[1]; out[2] = q[2]; out[3] = q[3];
        return out.Normalize(out);
    }

    Inverse(out = this) { return Quaternion.Inverse(this, out); }
    static Inverse(q, out = null) {
        out = out || new Quaternion();
        const dot = q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3];
        if (dot === 0) return Quaternion.Identity(out);
        const invDot = 1.0 / dot;
        out[0] = -q[0] * invDot;
        out[1] = -q[1] * invDot;
        out[2] = -q[2] * invDot;
        out[3] = q[3] * invDot;
        return out;
    }

    static FromAxisAngle(axis, angleDegrees, out = null) {
        out = out || new Quaternion();
        const halfRad = angleDegrees * (Math.PI / 180) * 0.5;
        const s = Math.sin(halfRad);
        out[0] = axis[0] * s;
        out[1] = axis[1] * s;
        out[2] = axis[2] * s;
        out[3] = Math.cos(halfRad);
        return out.Normalize(out);
    }

    static LookRotation(forward, upwards = Vector3.up, out = null) {
        out = out || new Quaternion();

        let fx = forward[0], fy = forward[1], fz = forward[2];
        let len = Math.sqrt(fx * fx + fy * fy + fz * fz);
        if (len === 0) return Quaternion.Identity(out);
        fx /= len; fy /= len; fz /= len;

        let ux = upwards[0], uy = upwards[1], uz = upwards[2];
        let rx = uy * fz - uz * fy;
        let ry = uz * fx - ux * fz;
        let rz = ux * fy - uy * fx;

        let rLenSq = rx * rx + ry * ry + rz * rz;
        if (rLenSq < 0.00001) {
            rx = fz; ry = 0; rz = -fx;
            rLenSq = rx * rx + rz * rz;
            if (rLenSq < 0.00001) {
                rx = 0; ry = -fz; rz = fy;
                rLenSq = ry * ry + rz * rz;
            }
        }

        const rLen = Math.sqrt(rLenSq);
        rx /= rLen; ry /= rLen; rz /= rLen;

        ux = fy * rz - fz * ry;
        uy = fz * rx - fx * rz;
        uz = fx * ry - fy * rx;

        const m00 = rx, m01 = ry, m02 = rz;
        const m10 = ux, m11 = uy, m12 = uz;
        const m20 = fx, m21 = fy, m22 = fz;

        const tr = m00 + m11 + m22;

        if (tr > 0) {
            const s = Math.sqrt(tr + 1.0) * 2;
            out[3] = 0.25 * s;
            out[0] = (m12 - m21) / s;
            out[1] = (m20 - m02) / s;
            out[2] = (m01 - m10) / s;
        } else if ((m00 > m11) && (m00 > m22)) {
            const s = Math.sqrt(1.0 + m00 - m11 - m22) * 2;
            out[3] = (m12 - m21) / s;
            out[0] = 0.25 * s;
            out[1] = (m01 + m10) / s;
            out[2] = (m02 + m20) / s;
        } else if (m11 > m22) {
            const s = Math.sqrt(1.0 + m11 - m00 - m22) * 2;
            out[3] = (m20 - m02) / s;
            out[0] = (m01 + m10) / s;
            out[1] = 0.25 * s;
            out[2] = (m12 + m21) / s;
        } else {
            const s = Math.sqrt(1.0 + m22 - m00 - m11) * 2;
            out[3] = (m01 - m10) / s;
            out[0] = (m02 + m20) / s;
            out[1] = (m12 + m21) / s;
            out[2] = 0.25 * s;
        }

        return out;
    }

    static Euler(x = 0, y = 0, z = 0, out = null) {
        out = out || new Quaternion();

        const radX = x * (Math.PI / 360);
        const radY = y * (Math.PI / 360);
        const radZ = z * (Math.PI / 360);

        const sx = Math.sin(radX), cx = Math.cos(radX);
        const sy = Math.sin(radY), cy = Math.cos(radY);
        const sz = Math.sin(radZ), cz = Math.cos(radZ);

        out[0] = sx * cy * cz + cx * sy * sz;
        out[1] = cx * sy * cz - sx * cy * sz;
        out[2] = cx * cy * sz - sx * sy * cz;
        out[3] = cx * cy * cz + sx * sy * sz;

        return out;
    }

    static ToEuler(q, out = null) {
        out = out || new Vector3();
        const x = q[0], y = q[1], z = q[2], w = q[3];

        const sinp = 2 * (w * x - y * z);
        let pitch;
        if (Math.abs(sinp) >= 1) {
            pitch = (Math.PI / 2) * Math.sign(sinp);
        } else {
            pitch = Math.asin(sinp);
        }

        const yaw = Math.atan2(2 * (w * y + z * x), 1 - 2 * (x * x + y * y));
        const roll = Math.atan2(2 * (w * z + x * y), 1 - 2 * (x * x + z * z));

        const radToDeg = 180 / Math.PI;
        out[0] = pitch * radToDeg;
        out[1] = yaw * radToDeg;
        out[2] = roll * radToDeg;

        return out;
    }

    static Slerp(a, b, t, out = null) {
        out = out || new Quaternion();

        let ax = a[0], ay = a[1], az = a[2], aw = a[3];
        let bx = b[0], by = b[1], bz = b[2], bw = b[3];

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
            return out.Normalize(out);
        }

        const halfTheta = Math.acos(cosHalfTheta);
        const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

        const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
        const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

        out[0] = ax * ratioA + bx * ratioB;
        out[1] = ay * ratioA + by * ratioB;
        out[2] = az * ratioA + bz * ratioB;
        out[3] = aw * ratioA + bw * ratioB;

        return out;
    }

    static Angle(a, b) {
        const dot = Math.min(Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]), 1.0);
        if (dot > 0.999999) return 0;
        return Math.acos(dot) * 2.0 * (180 / Math.PI);
    }

    static RotateTowards(from, to, maxDegreesDelta, out = null) {
        out = out || new Quaternion();
        const angle = Quaternion.Angle(from, to);

        if (angle === 0 || angle <= maxDegreesDelta) {
            out[0] = to[0]; out[1] = to[1]; out[2] = to[2]; out[3] = to[3];
            return out;
        }

        return Quaternion.Slerp(from, to, maxDegreesDelta / angle, out);
    }

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

        out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;

        return out;
    }
}