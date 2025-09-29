class Rigidbody extends Component {
    Init() {
        this.velocity = Vector3.zero;
        this.acceleration = Vector3.zero;
        this.mass = 1.0;
        this.useGravity = true;
        this.gravity = new Vector3(0, -9.81, 0);
        this.drag = 0.0;
        this.bounce = 0.5; // odbicie
        this.collider = this.GetComponent(Collider); // zakładamy, że istnieje
    }

    Update() {
        if (!Physics.simulate) return;
        if (!this.collider) return;

        // --- 1. Grawitacja ---
        if (this.useGravity) {
            this.acceleration = Vector3.Add(this.acceleration, this.gravity);
        }

        // --- 2. Aktualizacja prędkości ---
        this.velocity = Vector3.Add(this.velocity, Vector3.Multiply(this.acceleration, Time.deltaTime));

        // --- 3. Drag ---
        if (this.drag > 0.0) {
            this.velocity = Vector3.Multiply(this.velocity, 1.0 - this.drag * Time.deltaTime);
        }

        // --- 4. Nowa pozycja ---
        let newPos = Vector3.Add(this.transform.position, Vector3.Multiply(this.velocity, Time.deltaTime));

        // --- 5. Sprawdzenie kolizji ---
        for (const other of Collider.colliders) {
            if (other === this.collider) continue;

            const originalPos = this.transform.position;
            this.transform.position = newPos;

            if (this.collider.Intersects(other)) {
                const mtv = this.collider.ComputePenetration(other); // wektor wypchnięcia
                if (mtv) {
                    newPos = Vector3.Add(newPos, mtv);

                    // normalna = znormalizowany mtv
                    const contactNormal = mtv.Normalize();

                    // odbicie prędkości wzdłuż normalnej
                    const vDotN = this.velocity.Dot(contactNormal);
                    if (vDotN < 0) { // tylko jeśli się zbliża
                        this.velocity = Vector3.Subtract(this.velocity, Vector3.Multiply(contactNormal, vDotN * (1 + this.bounce)));
                    }

                    // Eventy
                    if (!this.collider._collidingWith.has(other)) {
                        this.collider.OnCollisionEnter(other);
                        this.collider._collidingWith.add(other);
                    } else {
                        this.collider.OnCollisionStay(other);
                    }
                }
            } else {
                if (this.collider._collidingWith.has(other)) {
                    this.collider.OnCollisionExit(other);
                    this.collider._collidingWith.delete(other);
                }
            }

            this.transform.position = originalPos; // przywróć przed kolejnym sprawdzeniem
        }

        // --- 6. Aktualizacja pozycji końcowej ---
        this.transform.position = newPos;

        // --- 7. Reset przyspieszenia ---
        this.acceleration.Set(0, 0, 0);
    }

    AddForce(force) {
        const a = force.Multiply(1.0 / this.mass);
        this.acceleration = Vector3.Add(this.acceleration, a);
    }

    // Prosta normalna kontaktu dla odbicia
    ComputeContactNormal(other) {
        const myPos = this.transform.position;
        const otherPos = other.transform.position;
        return Vector3.Subtract(myPos, otherPos).Normalize();
    }
}
