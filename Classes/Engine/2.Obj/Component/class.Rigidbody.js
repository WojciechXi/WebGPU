class Rigidbody extends Component {

    Init() {
        this.angularDamping = 0.0;
        this.angularVelocity = Vector3.zero;
        this.automaticCenterOfMass = true;
        this.automaticInertiaTensor = false;

        this.centerOfMass = Vector3.zero;
        //this.collisionDetectionMode = 0;
        //this.constraints = 0;
        //this.detectCollisions = 0;
        //this.excludeLayers = 0;
        //this.freezeRotation = 0;
        //this.includeLayers = 0;
        //this.inertiaTensor = 0;
        //this.inertiaTensorRotation = 0;
        //this.interpolation = 0;
        this.isKinematic = false;
        //this.linearDamping = 0;
        this.linearVelocity = Vector3.zero;
        this.mass = 1.0;
        //this.maxAngularVelocity = 0;
        //this.maxDepenetrationVelocity = 0;
        //this.maxLinearVelocity = 0;
        this.position = this.transform.position;
        this.rotation = this.transform.rotation;
        //this.sleepThreshold = 0;
        //this.solverIterations = 0;
        //this.solverVelocityIterations = 0;
        this.useGravity = true;
        //this.worldCenterOfMass = 0;

        this.acceleration = Vector3.zero;
        this.drag = 0.0;
        this.bounce = 0.5; // odbicie
    }

    OnEnable() {
        this.collider = this.GetComponent(Collider);
    }

    FixedUpdate() {
        if (!Physics.simulate) return;

        this.position = this.transform.position;
        this.rotation = this.transform.rotation;

        // --- 1. Grawitacja ---
        if (this.useGravity) this.acceleration = Vector3.Add(this.acceleration, Physics.gravity);

        // --- 2. Aktualizacja prędkości ---
        this.linearVelocity = Vector3.Add(this.linearVelocity, Vector3.Multiply(this.acceleration, Time.fixedDeltaTime));

        // --- 3. Drag ---
        if (this.drag > 0.0) this.linearVelocity = Vector3.Multiply(this.linearVelocity, 1.0 - this.drag * Time.fixedDeltaTime);

        // --- 4. Nowa pozycja ---
        let newPosition = Vector3.Add(this.position, Vector3.Multiply(this.linearVelocity, Time.fixedDeltaTime));

        if (this.collider) { // --- 5. Sprawdzenie kolizji ---
            for (const other of Collider.colliders) {
                if (other === this.collider) continue;

                const originalPos = this.position;
                this.position = newPosition;

                if (this.collider.Intersects(other)) {
                    const mtv = this.collider.ComputePenetration(other); // wektor wypchnięcia
                    if (mtv) {
                        newPosition = Vector3.Add(newPosition, mtv);

                        // normalna = znormalizowany mtv
                        const contactNormal = mtv.Normalize();

                        // odbicie prędkości wzdłuż normalnej
                        const vDotN = this.linearVelocity.Dot(contactNormal);
                        if (vDotN < 0) { // tylko jeśli się zbliża
                            this.linearVelocity = Vector3.Subtract(this.linearVelocity, Vector3.Multiply(contactNormal, vDotN * (1 + this.bounce)));
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

                this.position = originalPos; // przywróć przed kolejnym sprawdzeniem
            }
        }

        // --- 6. Aktualizacja pozycji końcowej ---
        this.position = newPosition;

        // --- 7. Reset przyspieszenia ---
        this.acceleration.Set(0, 0, 0);
    }

    Update() {
        this.transform.position = this.position;
        this.transform.rotation = this.rotation;
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
