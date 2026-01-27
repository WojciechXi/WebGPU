class Rigidbody extends Component {

    Init() {
        this.angularVelocity = Vector3.zero;
        this.linearVelocity = Vector3.zero;
        this.acceleration = Vector3.zero;

        this.mass = 1;
        this.inertia = 1.16;
        this.bounce = 1; // odbicie
        this.drag = 0.01;
        this.angularDrag = 0.05;

        this.angularDamping = 0.0;
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
        //this.linearDamping = 0;
        //this.maxAngularVelocity = 0;
        //this.maxDepenetrationVelocity = 0;
        //this.maxLinearVelocity = 0;
        //this.sleepThreshold = 0;
        //this.solverIterations = 0;
        //this.solverVelocityIterations = 0;
        //this.worldCenterOfMass = 0;

        this.isKinematic = false;
        this.useGravity = true;

        this.position = this.transform.position;
        this.rotation = this.transform.rotation;

        //private
        this._isSleeping = false;
    }

    get worldCenterOfMass() { return this.transform.TransformPoint(this.centerOfMass); }

    // Messages
    // OnCollisionEnter(collision) { }
    // OnCollisionExit(collision) { }
    // OnCollisionStay(collision) { }

    OnEnable() {
        this.collider = this.GetComponent(Collider);
        if (this.collider) {
            this.centerOfMass = this.collider.center;
        }
    }

    FixedUpdate() {
        if (!Physics.simulate || this.isKinematic) return;

        this.position = this.transform.position;
        this.rotation = this.transform.rotation;

        // --- 1. Grawitacja i Opory ---
        if (this.useGravity) this.acceleration = this.acceleration.Add(Physics.gravity);

        // Tłumienie (Damping)
        this.linearVelocity = this.linearVelocity.Multiply(1.0 - this.drag);
        this.angularVelocity = this.angularVelocity.Multiply(1.0 - this.angularDrag);

        // --- 2. Aktualizacja Rotacji ---
        if (this.angularVelocity.magnitude > 0.001) {
            const rotationStep = Vector3.Multiply(this.angularVelocity, Time.fixedDeltaTime);
            this.rotation = Quaternion.Multiply(this.rotation, Quaternion.Euler(
                rotationStep.x,
                rotationStep.y,
                rotationStep.z
            )).Normalize();
        }

        // --- 3. Aktualizacja Prędkości i Pozycji ---
        this.linearVelocity = this.linearVelocity.Add(Vector3.Multiply(this.acceleration, Time.fixedDeltaTime));
        let nextPosition = this.position.Add(Vector3.Multiply(this.linearVelocity, Time.fixedDeltaTime));

        if (this.collider) {
            for (const other of this.scene.colliders) {
                if (other === this.collider) continue;

                this.transform.position = this.position;
                this.transform.rotation = this.rotation;

                if (this.collider.Intersects(other)) {
                    const mtv = this.collider.ComputePenetration(other);
                    if (!mtv) continue;

                    if (mtv.point) {
                        nextPosition = nextPosition.Add(Vector3.Multiply(mtv.normal, mtv.overlap));

                        this.transform.position = this.position;
                        this.transform.rotation = this.rotation;

                        // C. Reakcja (Impuls w punkcie)
                        const vDotN = this.linearVelocity.Dot(mtv.normal);
                        if (vDotN < 0) {
                            const j = -(1 + this.bounce) * vDotN * this.mass;
                            const impulse = Vector3.Multiply(mtv.normal, j);

                            this.AddForceAtPosition(impulse, mtv.point, ForceMode.Impulse);
                        }
                    } else {
                        // A. Wypchnięcie
                        nextPosition = nextPosition.Add(mtv);

                        this.transform.position = this.position;
                        this.transform.rotation = this.rotation;

                        // B. Punkt styku i Impuls
                        const contactNormal = mtv.normalized;
                        const contactPoint = OBB.GetContactPoint(this.collider.obb, other.obb, contactNormal, mtv);

                        // C. Reakcja (Impuls w punkcie)
                        const vDotN = this.linearVelocity.Dot(contactNormal);
                        if (vDotN < 0) {
                            const j = -(1 + this.bounce) * vDotN * this.mass;
                            const impulse = Vector3.Multiply(contactNormal, j);

                            this.AddForceAtPosition(impulse, contactPoint, ForceMode.Impulse);
                        }
                    }

                    // Eventy
                    if (!this.collider._collidingWith.has(other)) {
                        this.collider._collidingWith.add(other);
                        this.SendMessage('OnCollisionEnter', other);
                    } else {
                        this.SendMessage('OnCollisionStay', other);
                    }
                } else {
                    if (this.collider._collidingWith.has(other)) {
                        this.collider._collidingWith.delete(other);
                        this.SendMessage('OnCollisionExit', other);
                    }
                }
            }
        }

        this.position = nextPosition;
        this.acceleration.Set(0, 0, 0);

        this.transform.position = this.position;
        this.transform.rotation = this.rotation;
    }

    AddExplosionForce(explosionForce, explosionPosition, explosionRadius, upwardsModifier = 0.0, mode = ForceMode.Force) {
        if (!Physics.simulate || this.isKinematic) return;
    }
    AddForce(force, mode = ForceMode.Force) {
        if (!Physics.simulate || this.isKinematic) return;

        if (mode == ForceMode.Impulse) {
            const a = force.Multiply(1.0 / this.mass);
            this.acceleration.Add(a);
        }
    }
    AddForceAtPosition(force, position, mode = ForceMode.Force) {
        if (!Physics.simulate || this.isKinematic) return;
        if (mode == ForceMode.Impulse) {
            this.linearVelocity = this.linearVelocity.Add(Vector3.Multiply(force, 1.0 / this.mass));

            const leverArm = Vector3.Subtract(position, this.position);
            const torque = leverArm.Cross(force);

            // Zakładając uproszczony moment bezwładności (J)
            const angularImpulse = Vector3.Multiply(torque, 1.0 / this.inertia);
            this.angularVelocity = this.angularVelocity.Add(angularImpulse);
        }
    }
    AddRelativeForce(force, mode = ForceMode.Force) {
        if (!Physics.simulate || this.isKinematic) return;
    }
    AddRelativeTorque(torque, mode = ForceMode.Force) {
        if (!Physics.simulate || this.isKinematic) return;
    }
    AddTorque(torque, mode = ForceMode.Force) {
        if (!Physics.simulate || this.isKinematic) return;
    }
    ClosestPointOnBounds(position) { }
    GetAccumulatedForce(step = Time.fixedDeltaTime) { }
    GetAccumulatedTorque(step = Time.fixedDeltaTime) { }
    GetPointVelocity(worldPoint) { }
    GetRelativePointVelocity(relativePoint) { }
    IsSleeping() { return this._isSleeping; }
    Move(position, rotation) { }
    MovePosition(position) { }
    MoveRotation(rotation) { }
    PublishTransform() {
        this.transform.position = this.position;
        this.transform.rotation = this.rotation;
    }
    ResetCenterOfMass() { }
    ResetInertiaTensor() { }
    Sleep() { this._isSleeping = true; }
    SweepTest(direction, maxDistance = Mathf.Infinity, queryTriggerInteraction = QueryTriggerInteraction.UseGlobal, raycastHit = null) {
        raycastHit = raycastHit || new RaycastHit();

        return raycastHit;
    }
    SweepTestAll(direction, maxDistance = Mathf.Infinity, queryTriggerInteraction = QueryTriggerInteraction.UseGlobal) { }
    WakeUp() { this._isSleeping = false; }

}
