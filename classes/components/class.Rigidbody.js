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
        if (!this.collider) return;

        // --- 1. Grawitacja ---
        if (this.useGravity) {
            this.acceleration.Add(this.gravity);
        }

        // --- 2. Aktualizacja prędkości ---
        this.velocity.Add(Vector3.Multiply(this.acceleration, Time.deltaTime));

        // --- 3. Drag ---
        if (this.drag > 0.0) {
            this.velocity.Multiply(1.0 - this.drag * Time.deltaTime);
        }

        // --- 4. Nowa pozycja ---
        let newPos = this.transform.position.Add(Vector3.Multiply(this.velocity, Time.deltaTime));

        // --- 5. Sprawdzenie kolizji ---
        for (const other of Collider.colliders) {
            if (other === this.collider) continue;

            const originalPos = this.transform.position;
            this.transform.position = newPos;

            if (this.collider.Intersects(other)) {
                // --- Reakcja fizyczna ---
                const contactNormal = this.ComputeContactNormal(other);

                // odbicie prędkości wzdłuż normalnej
                const vDotN = this.velocity.Dot(contactNormal);
                this.velocity.Subtract(contactNormal.Multiply(vDotN * (1 + this.bounce)));

                // przesunięcie obiektu poza kolizję
                newPos.Add(contactNormal.Multiply(0.01));

                // Eventy
                if (!this.collider._collidingWith.has(other)) {
                    this.collider.OnCollisionEnter(other);
                    this.collider._collidingWith.add(other);
                } else {
                    this.collider.OnCollisionStay(other);
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
        this.acceleration = Vector3.zero;
    }

    AddForce(force) {
        const a = force.Multiply(1.0 / this.mass);
        this.acceleration = this.acceleration.Add(a);
    }

    // Prosta normalna kontaktu dla odbicia
    ComputeContactNormal(other) {
        const myPos = this.transform.position;
        const otherPos = other.transform.position;
        return myPos.Subtract(otherPos).Normalize();
    }
}
