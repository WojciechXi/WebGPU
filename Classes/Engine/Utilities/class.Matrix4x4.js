class Matrix4x4 extends Float32Array {

    static Projection(width, height, depth, dst) {
        return Matrix4x4.Ortho(0, width, height, 0, depth, -depth, dst);
    }

    static PerspectiveLH(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
        dst = dst || new Matrix4x4();

        const f = 1.0 / Math.tan(fieldOfViewYInRadians * 0.5);

        dst[0] = f / aspect;
        dst[1] = 0;
        dst[2] = 0;
        dst[3] = 0;

        dst[4] = 0;
        dst[5] = f;
        dst[6] = 0;
        dst[7] = 0;

        dst[8] = 0;
        dst[9] = 0;
        dst[10] = zFar / (zFar - zNear);
        dst[11] = 1;

        dst[12] = 0;
        dst[13] = 0;
        dst[14] = -zNear * zFar / (zFar - zNear);
        dst[15] = 0;

        return dst;
    }

    static Perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
        dst = dst || new Matrix4x4();

        const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
        const rangeInv = 1 / (zNear - zFar);

        dst[0] = f / aspect;
        dst[1] = 0;
        dst[2] = 0;
        dst[3] = 0;

        dst[4] = 0;
        dst[5] = f;
        dst[6] = 0;
        dst[7] = 0;

        dst[8] = 0;
        dst[9] = 0;
        dst[10] = zFar * rangeInv;
        dst[11] = -1;

        dst[12] = 0;
        dst[13] = 0;
        dst[14] = zNear * zFar * rangeInv;
        dst[15] = 0;

        return dst;
    }

    static OrthoLH(left, right, bottom, top, near, far, dst) {
        dst = dst || new Matrix4x4();

        dst[0] = 2 / (right - left);
        dst[1] = 0;
        dst[2] = 0;
        dst[3] = 0;

        dst[4] = 0;
        dst[5] = 2 / (top - bottom);
        dst[6] = 0;
        dst[7] = 0;

        dst[8] = 0;
        dst[9] = 0;
        dst[10] = 1 / (far - near);    // <-- UWAGA: far - near (a nie near - far)
        dst[11] = 0;

        dst[12] = (left + right) / (left - right);
        dst[13] = (top + bottom) / (bottom - top);
        dst[14] = -near / (far - near); // <-- DirectX LH konwencja
        dst[15] = 1;

        return dst;
    }

    static Ortho(left, right, bottom, top, near, far, dst) {
        dst = dst || new Matrix4x4();

        dst[0] = 2 / (right - left);
        dst[1] = 0;
        dst[2] = 0;
        dst[3] = 0;

        dst[4] = 0;
        dst[5] = 2 / (top - bottom);
        dst[6] = 0;
        dst[7] = 0;

        dst[8] = 0;
        dst[9] = 0;
        dst[10] = 1 / (near - far);
        dst[11] = 0;

        dst[12] = (right + left) / (left - right);
        dst[13] = (top + bottom) / (bottom - top);
        dst[14] = near / (near - far);
        dst[15] = 1;

        return dst;
    }

    static Identity(dst) {
        dst = dst || new Matrix4x4();
        dst[0] = 1; dst[1] = 0; dst[2] = 0; dst[3] = 0;
        dst[4] = 0; dst[5] = 1; dst[6] = 0; dst[7] = 0;
        dst[8] = 0; dst[9] = 0; dst[10] = 1; dst[11] = 0;
        dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
        return dst;
    }

    static Multiply(a, b, dst) {
        dst = dst || new Matrix4x4();
        const b00 = b[0 * 4 + 0];
        const b01 = b[0 * 4 + 1];
        const b02 = b[0 * 4 + 2];
        const b03 = b[0 * 4 + 3];
        const b10 = b[1 * 4 + 0];
        const b11 = b[1 * 4 + 1];
        const b12 = b[1 * 4 + 2];
        const b13 = b[1 * 4 + 3];
        const b20 = b[2 * 4 + 0];
        const b21 = b[2 * 4 + 1];
        const b22 = b[2 * 4 + 2];
        const b23 = b[2 * 4 + 3];
        const b30 = b[3 * 4 + 0];
        const b31 = b[3 * 4 + 1];
        const b32 = b[3 * 4 + 2];
        const b33 = b[3 * 4 + 3];
        const a00 = a[0 * 4 + 0];
        const a01 = a[0 * 4 + 1];
        const a02 = a[0 * 4 + 2];
        const a03 = a[0 * 4 + 3];
        const a10 = a[1 * 4 + 0];
        const a11 = a[1 * 4 + 1];
        const a12 = a[1 * 4 + 2];
        const a13 = a[1 * 4 + 3];
        const a20 = a[2 * 4 + 0];
        const a21 = a[2 * 4 + 1];
        const a22 = a[2 * 4 + 2];
        const a23 = a[2 * 4 + 3];
        const a30 = a[3 * 4 + 0];
        const a31 = a[3 * 4 + 1];
        const a32 = a[3 * 4 + 2];
        const a33 = a[3 * 4 + 3];

        dst[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
        dst[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
        dst[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
        dst[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;

        dst[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
        dst[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
        dst[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
        dst[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;

        dst[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
        dst[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
        dst[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
        dst[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;

        dst[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
        dst[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
        dst[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
        dst[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

        return dst;
    }

    static Inverse(m, dst) {
        dst = dst || new Matrix4x4();

        const m00 = m[0 * 4 + 0];
        const m01 = m[0 * 4 + 1];
        const m02 = m[0 * 4 + 2];
        const m03 = m[0 * 4 + 3];
        const m10 = m[1 * 4 + 0];
        const m11 = m[1 * 4 + 1];
        const m12 = m[1 * 4 + 2];
        const m13 = m[1 * 4 + 3];
        const m20 = m[2 * 4 + 0];
        const m21 = m[2 * 4 + 1];
        const m22 = m[2 * 4 + 2];
        const m23 = m[2 * 4 + 3];
        const m30 = m[3 * 4 + 0];
        const m31 = m[3 * 4 + 1];
        const m32 = m[3 * 4 + 2];
        const m33 = m[3 * 4 + 3];

        const tmp0 = m22 * m33;
        const tmp1 = m32 * m23;
        const tmp2 = m12 * m33;
        const tmp3 = m32 * m13;
        const tmp4 = m12 * m23;
        const tmp5 = m22 * m13;
        const tmp6 = m02 * m33;
        const tmp7 = m32 * m03;
        const tmp8 = m02 * m23;
        const tmp9 = m22 * m03;
        const tmp10 = m02 * m13;
        const tmp11 = m12 * m03;
        const tmp12 = m20 * m31;
        const tmp13 = m30 * m21;
        const tmp14 = m10 * m31;
        const tmp15 = m30 * m11;
        const tmp16 = m10 * m21;
        const tmp17 = m20 * m11;
        const tmp18 = m00 * m31;
        const tmp19 = m30 * m01;
        const tmp20 = m00 * m21;
        const tmp21 = m20 * m01;
        const tmp22 = m00 * m11;
        const tmp23 = m10 * m01;

        const t0 = (tmp0 * m11 + tmp3 * m21 + tmp4 * m31) -
            (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
        const t1 = (tmp1 * m01 + tmp6 * m21 + tmp9 * m31) -
            (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
        const t2 = (tmp2 * m01 + tmp7 * m11 + tmp10 * m31) -
            (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
        const t3 = (tmp5 * m01 + tmp8 * m11 + tmp11 * m21) -
            (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);

        const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

        dst[0] = d * t0;
        dst[1] = d * t1;
        dst[2] = d * t2;
        dst[3] = d * t3;

        dst[4] = d * ((tmp1 * m10 + tmp2 * m20 + tmp5 * m30) -
            (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
        dst[5] = d * ((tmp0 * m00 + tmp7 * m20 + tmp8 * m30) -
            (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
        dst[6] = d * ((tmp3 * m00 + tmp6 * m10 + tmp11 * m30) -
            (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
        dst[7] = d * ((tmp4 * m00 + tmp9 * m10 + tmp10 * m20) -
            (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));

        dst[8] = d * ((tmp12 * m13 + tmp15 * m23 + tmp16 * m33) -
            (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
        dst[9] = d * ((tmp13 * m03 + tmp18 * m23 + tmp21 * m33) -
            (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
        dst[10] = d * ((tmp14 * m03 + tmp19 * m13 + tmp22 * m33) -
            (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
        dst[11] = d * ((tmp17 * m03 + tmp20 * m13 + tmp23 * m23) -
            (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));

        dst[12] = d * ((tmp14 * m22 + tmp17 * m32 + tmp13 * m12) -
            (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
        dst[13] = d * ((tmp20 * m32 + tmp12 * m02 + tmp19 * m22) -
            (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
        dst[14] = d * ((tmp18 * m12 + tmp23 * m32 + tmp15 * m02) -
            (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
        dst[15] = d * ((tmp22 * m22 + tmp16 * m02 + tmp21 * m12) -
            (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));
        return dst;
    }

    static Translation([tx, ty, tz], dst) {
        dst = dst || new Matrix4x4();
        dst[0] = 1; dst[1] = 0; dst[2] = 0; dst[3] = 0;
        dst[4] = 0; dst[5] = 1; dst[6] = 0; dst[7] = 0;
        dst[8] = 0; dst[9] = 0; dst[10] = 1; dst[11] = 0;
        dst[12] = tx; dst[13] = ty; dst[14] = tz; dst[15] = 1;
        return dst;
    }

    static RotationX(angleInRadians, dst) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);
        dst = dst || new Matrix4x4();
        dst[0] = 1; dst[1] = 0; dst[2] = 0; dst[3] = 0;
        dst[4] = 0; dst[5] = c; dst[6] = s; dst[7] = 0;
        dst[8] = 0; dst[9] = -s; dst[10] = c; dst[11] = 0;
        dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
        return dst;
    }

    static RotationY(angleInRadians, dst) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);
        dst = dst || new Matrix4x4();
        dst[0] = c; dst[1] = 0; dst[2] = -s; dst[3] = 0;
        dst[4] = 0; dst[5] = 1; dst[6] = 0; dst[7] = 0;
        dst[8] = s; dst[9] = 0; dst[10] = c; dst[11] = 0;
        dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
        return dst;
    }

    static RotationZ(angleInRadians, dst) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);
        dst = dst || new Matrix4x4();
        dst[0] = c; dst[1] = s; dst[2] = 0; dst[3] = 0;
        dst[4] = -s; dst[5] = c; dst[6] = 0; dst[7] = 0;
        dst[8] = 0; dst[9] = 0; dst[10] = 1; dst[11] = 0;
        dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
        return dst;
    }

    static Scaling([sx, sy, sz], dst) {
        dst = dst || new Matrix4x4();
        dst[0] = sx; dst[1] = 0; dst[2] = 0; dst[3] = 0;
        dst[4] = 0; dst[5] = sy; dst[6] = 0; dst[7] = 0;
        dst[8] = 0; dst[9] = 0; dst[10] = sz; dst[11] = 0;
        dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
        return dst;
    }

    static SetTranslation(matrix, v) {
        matrix[12] = v.x;
        matrix[13] = v.y;
        matrix[14] = v.z;
        return matrix;
    }

    // Jeśli chcesz, można zrobić też wersję, która zwraca nową macierz
    static WithTranslation(matrix, v) {
        const out = new Float32Array(matrix);
        out[12] = v.x;
        out[13] = v.y;
        out[14] = v.z;
        return out;
    }

    static Translate(m, Translation, dst) {
        return Matrix4x4.Multiply(m, Matrix4x4.Translation(Translation), dst);
    }

    static RotateX(m, angle, dst) {
        return Matrix4x4.Multiply(m, Matrix4x4.RotationX(Math.DegToRad(angle)), dst);
    }

    static RotateY(m, angle, dst) {
        return Matrix4x4.Multiply(m, Matrix4x4.RotationY(Math.DegToRad(angle)), dst);
    }

    static RotateZ(m, angle, dst) {
        return Matrix4x4.Multiply(m, Matrix4x4.RotationZ(Math.DegToRad(angle)), dst);
    }

    static Scale(m, scale, dst) {
        return Matrix4x4.Multiply(m, Matrix4x4.Scaling(scale), dst);
    }

    /** Z translacji, rotacji (quaternion) i skali */
    static TRS(position, rotation, scale, dst = null) {
        dst = dst || new Matrix4x4();

        // --- ROTACJA Z KWATERNIONU ---
        const [x, y, z, w] = rotation;
        const xx = x * x, yy = y * y, zz = z * z;
        const xy = x * y, xz = x * z, yz = y * z;
        const wx = w * x, wy = w * y, wz = w * z;

        // macierz rotacji (bez skali)
        let r00 = 1 - 2 * (yy + zz);
        let r01 = 2 * (xy + wz);
        let r02 = 2 * (xz - wy);

        let r10 = 2 * (xy - wz);
        let r11 = 1 - 2 * (xx + zz);
        let r12 = 2 * (yz + wx);

        let r20 = 2 * (xz + wy);
        let r21 = 2 * (yz - wx);
        let r22 = 1 - 2 * (xx + yy);

        // --- ROTACJA * SKALA ---
        dst[0] = r00 * scale.x;
        dst[1] = r01 * scale.x;
        dst[2] = r02 * scale.x;
        dst[3] = 0;

        dst[4] = r10 * scale.y;
        dst[5] = r11 * scale.y;
        dst[6] = r12 * scale.y;
        dst[7] = 0;

        dst[8] = r20 * scale.z;
        dst[9] = r21 * scale.z;
        dst[10] = r22 * scale.z;
        dst[11] = 0;

        // --- TRANSLACJA ---
        dst[12] = position.x;
        dst[13] = position.y;
        dst[14] = position.z;
        dst[15] = 1;

        return dst;
    }

    static FromQuaternion(q, out = null) {
        if (!out) out = Matrix4x4.Identity();
        const x = q.x, y = q.y, z = q.z, w = q.w;

        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2;
        const yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;

        out[0] = 1 - (yy + zz);
        out[1] = xy + wz;
        out[2] = xz - wy;
        out[3] = 0;

        out[4] = xy - wz;
        out[5] = 1 - (xx + zz);
        out[6] = yz + wx;
        out[7] = 0;

        out[8] = xz + wy;
        out[9] = yz - wx;
        out[10] = 1 - (xx + yy);
        out[11] = 0;

        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;

        return out;
    }

    /** Wyciąga pozycję, rotację (quat) i skalę z macierzy */
    static Decompose(m) {
        const position = new Vector3(m[12], m[13], m[14]);

        // skale to długości wektorów osi
        const sx = Math.hypot(m[0], m[1], m[2]);
        const sy = Math.hypot(m[4], m[5], m[6]);
        const sz = Math.hypot(m[8], m[9], m[10]);
        const scale = new Vector3(sx, sy, sz);

        // normalizowana macierz rotacji
        const rm = new Matrix4x4();
        rm.set(m);
        rm[0] /= sx; rm[1] /= sx; rm[2] /= sx;
        rm[4] /= sy; rm[5] /= sy; rm[6] /= sy;
        rm[8] /= sz; rm[9] /= sz; rm[10] /= sz;

        const rotation = Matrix4x4.ToQuaternion(rm);

        return { position, rotation, scale };
    }

    /** Konwersja macierzy rotacji na quaternion */
    static ToQuaternion(m) {
        const trace = m[0] + m[5] + m[10];
        let x, y, z, w;

        if (trace > 0) {
            let s = 0.5 / Math.sqrt(trace + 1.0);
            w = 0.25 / s;
            x = (m[6] - m[9]) * s;
            y = (m[8] - m[2]) * s;
            z = (m[1] - m[4]) * s;
        } else {
            if (m[0] > m[5] && m[0] > m[10]) {
                let s = 2.0 * Math.sqrt(1.0 + m[0] - m[5] - m[10]);
                w = (m[6] - m[9]) / s;
                x = 0.25 * s;
                y = (m[1] + m[4]) / s;
                z = (m[2] + m[8]) / s;
            } else if (m[5] > m[10]) {
                let s = 2.0 * Math.sqrt(1.0 + m[5] - m[0] - m[10]);
                w = (m[8] - m[2]) / s;
                x = (m[1] + m[4]) / s;
                y = 0.25 * s;
                z = (m[6] + m[9]) / s;
            } else {
                let s = 2.0 * Math.sqrt(1.0 + m[10] - m[0] - m[5]);
                w = (m[1] - m[4]) / s;
                x = (m[2] + m[8]) / s;
                y = (m[6] + m[9]) / s;
                z = 0.25 * s;
            }
        }

        return new Quaternion(x, y, z, w);
    }

    /** Mnożenie wektora 3D przez macierz (punkt, w=1) */
    static MultiplyVector3(m, v, dst) {
        const x = v.x, y = v.y, z = v.z;
        const d = dst || new Vector3();

        d.x = m[0] * x + m[4] * y + m[8] * z + m[12];
        d.y = m[1] * x + m[5] * y + m[9] * z + m[13];
        d.z = m[2] * x + m[6] * y + m[10] * z + m[14];

        return d;
    }

    constructor() {
        super(16);
        Matrix4x4.Identity(this);
    }

    set(m) {
        for (let i = 0; i < this.length; i++) {
            this[i] = m[i];
        }
    }

}