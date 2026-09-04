class Rigidbody extends Component {

    constructor() {
        super();
        const object = this;

        new Property(object, 'angularVelocity', Vector3.zero);
        new Property(object, 'linearVelocity', Vector3.zero);
        new Property(object, 'acceleration', Vector3.zero);
        new Property(object, 'centerOfMass', Vector3.zero);

        this.mass = 1;
        this.bounce = 1; // odbicie
        this.drag = 0.01;
        this.angularDrag = 0.05;

        this.angularDamping = 0.0;
        this.automaticCenterOfMass = true;
        this.automaticInertiaTensor = false;
        //this.collisionDetectionMode = 0;
        //this.constraints = 0;
        //this.detectCollisions = 0;
        //this.excludeLayers = 0;
        //this.freezeRotation = 0;
        //this.includeLayers = 0;
        //this.inertiaTensorRotation = 0;
        //this.interpolation = 0;
        //this.linearDamping = 0;
        //this.maxAngularVelocity = 0;
        //this.maxDepenetrationVelocity = 0;
        //this.maxLinearVelocity = 0;
        //this.solverIterations = 0;
        //this.solverVelocityIterations = 0;
        //this.worldCenterOfMass = 0;

        this.freezeRotationX = false;
        this.freezeRotationY = false;
        this.freezeRotationZ = false;

        this.inertiaTensor = (2 / 5) * this.mass * 0.5;
        this.sleepThreshold = 0.1;

        this.isKinematic = false;
        this.useGravity = true;

        this.position = Vector3.zero;
        this.rotation = Quaternion.identity;

        //private
        this._isSleeping = false;
        this._sleepTimer = 0;
    }

    get worldCenterOfMass() { return Vector3.Add(this.position, this.rotation.MultiplyVector3(this.centerOfMass)); }

    // Messages
    // OnCollisionEnter(collision) { }
    // OnCollisionExit(collision) { }
    // OnCollisionStay(collision) { }

    OnEnable() {
        this.collider = this.GetComponent(Collider);

        this.position = this.transform.position;
        this.rotation = this.transform.rotation;

        this.ResetCenterOfMass();
    }

    FixedUpdate() {
        if (!Physics.simulate || this.isKinematic) return;

        const slop = 0.01;
        const persistence = 0.2;

        if (this.linearVelocity.magnitude < this.sleepThreshold && this.angularVelocity.magnitude < this.sleepThreshold) {
            this._sleepTimer += Time.fixedDeltaTime;
            if (this._sleepTimer > 2.0) this.Sleep();
        } else {
            this.WakeUp();
            this._sleepTimer = 0;
        }

        if (this._isSleeping) return;

        this.position = this.transform.position;
        this.rotation = this.transform.rotation;

        // --- 1. Grawitacja i Opory ---
        if (this.useGravity) this.acceleration = this.acceleration.Add(Physics.gravity);

        // Tłumienie (Damping)
        const dampingMultiplier = (this.linearVelocity.magnitude < 0.1) ? 0.8 : (1.0 - this.drag);
        this.linearVelocity = this.linearVelocity.Multiply(dampingMultiplier);
        this.angularVelocity = this.angularVelocity.Multiply(1.0 - this.angularDrag);

        if (this.linearVelocity.magnitude < 0.005) this.linearVelocity.Set(0, 0, 0);
        if (this.angularVelocity.magnitude < 0.005) this.angularVelocity.Set(0, 0, 0);

        if (this.freezeRotationX) this.angularVelocity.x = 0;
        if (this.freezeRotationY) this.angularVelocity.y = 0;
        if (this.freezeRotationZ) this.angularVelocity.z = 0;

        // --- 2. Aktualizacja Rotacji ---
        if (this.angularVelocity.magnitude > Mathf.Epsilon) {
            const rotationStep = Vector3.Multiply(this.angularVelocity, Time.fixedDeltaTime);
            this.rotation = this.rotation.Multiply(Quaternion.Euler(rotationStep.x, rotationStep.y, rotationStep.z)).Normalize();
        }

        // --- 3. Aktualizacja Prędkości i Pozycji ---
        this.linearVelocity = this.linearVelocity.Add(Vector3.Multiply(this.acceleration, Time.fixedDeltaTime));
        let nextPosition = this.position.Add(Vector3.Multiply(this.linearVelocity, Time.fixedDeltaTime));

        if (this.collider) {
            for (const other of this.scene.colliders) {
                if (other === this.collider) continue;

                if (this.collider.Intersects(other)) {
                    const collision = Geometry.Compute(this.collider.GetGeometry(), other.GetGeometry());
                    if (!collision) continue;

                    if (collision.point) {
                        const correction = Vector3.Multiply(collision.normal, collision.overlap);
                        nextPosition = nextPosition.Add(correction);

                        const r = Vector3.Subtract(collision.point, this.worldCenterOfMass);
                        const velocityAtPoint = Vector3.Add(this.linearVelocity, this.angularVelocity.Cross(r));
                        const vDotN = velocityAtPoint.Dot(collision.normal);
                        if (vDotN < 0) {
                            const j = -(1 + this.bounce) * vDotN * this.mass;
                            const impulse = Vector3.Multiply(collision.normal, j);

                            this.AddForce(impulse, ForceMode.Impulse);

                            const tangent = Vector3.Subtract(this.linearVelocity, Vector3.Multiply(collision.normal, vDotN));
                            if (tangent.magnitude > 0.001) {
                                const frictionImpulse = tangent.normalized.Multiply(-j * 0.5); // 0.5 to współczynnik tarcia
                                this.AddForce(frictionImpulse, ForceMode.Impulse);
                            }
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
    }

    Update() {
        this.PublishTransform();
    }

    AddForce(force, mode = ForceMode.Force) {
        if (!Physics.simulate || this.isKinematic) return;

        if (mode == ForceMode.Force) return this.linearVelocity = this.linearVelocity.Add(force.Multiply(Time.fixedDeltaTime / this.mass));
        else if (mode == ForceMode.Acceleration) return this.linearVelocity = this.linearVelocity.Add(force.Multiply(Time.fixedDeltaTime));
        else if (mode == ForceMode.Impulse) return this.linearVelocity = this.linearVelocity.Add(force.Multiply(1.0 / this.mass));
        else if (mode == ForceMode.VelocityChange) return this.linearVelocity = this.linearVelocity.Add(force);
    }
    AddRelativeForce(force, mode = ForceMode.Force) {
        if (!Physics.simulate || this.isKinematic) return;
        const worldForce = this.rotation.MultiplyVector(force);
        this.AddForce(worldForce, mode);
    }
    AddTorque(torque, mode = ForceMode.Force) {
        if (!Physics.simulate || this.isKinematic) return;

        if (mode == ForceMode.Force) return this.angularVelocity = this.angularVelocity.Add(Vector3.Multiply(torque, Time.fixedDeltaTime * (1.0 / this.inertiaTensor)));
        else if (mode == ForceMode.Acceleration) return this.angularVelocity = this.angularVelocity.Add(Vector3.Multiply(torque, Time.fixedDeltaTime));
        else if (mode == ForceMode.Impulse) return this.angularVelocity = this.angularVelocity.Add(Vector3.Multiply(torque, (1.0 / this.inertiaTensor)));
        else if (mode == ForceMode.VelocityChange) return this.angularVelocity = this.angularVelocity.Add(torque);
    }
    AddRelativeTorque(torque, mode = ForceMode.Force) {
        if (!Physics.simulate || this.isKinematic) return;
        const worldTorque = this.rotation.MultiplyVector(torque);
        this.AddTorque(worldTorque, mode);
    }
    AddForceAtPosition(force, position, mode = ForceMode.Force) {
        if (!Physics.simulate || this.isKinematic) return;

        this.AddForce(force, mode);

        const leverArm = Vector3.Subtract(position, this.worldCenterOfMass);
        const torque = leverArm.Cross(force);

        this.AddTorque(torque, mode);
    }
    AddExplosionForce(explosionForce, explosionPosition, explosionRadius, upwardsModifier = 0.0, mode = ForceMode.Force) {
        if (!Physics.simulate || this.isKinematic) return;

        let direction = Vector3.Subtract(this.worldCenterOfMass, explosionPosition);
        let distance = direction.magnitude;

        if (distance > explosionRadius) return;

        if (upwardsModifier !== 0) {
            direction.y += upwardsModifier;
            distance = direction.magnitude;
        }

        if (distance <= 0) direction = new Vector3(0, 1, 0);
        else direction = direction.Divide(distance);

        const falloff = 1.0 - (distance / explosionRadius);
        const finalForce = Vector3.Multiply(direction, explosionForce * falloff);

        this.AddForce(finalForce, mode);
    }
    ClosestPointOnBounds(position) { return this.collider ? this.collider.ClosestPointOnBounds(position) : Vector3.zero; }
    GetAccumulatedForce(step = Time.fixedDeltaTime) { return this.linearVelocity.Multiply(this.mass / step); }
    GetAccumulatedTorque(step = Time.fixedDeltaTime) { return this.angularVelocity.Multiply(this.inertiaTensor / step); }
    GetPointVelocity(worldPoint) {
        const leverArm = worldPoint.Subtract(this.worldCenterOfMass);
        const rotationalVelocity = this.angularVelocity.Cross(leverArm);
        return this.linearVelocity.Add(rotationalVelocity);
    }
    GetRelativePointVelocity(relativePoint) {
        const worldPoint = this.rotation.MultiplyVector(relativePoint).Add(this.position);
        return this.GetPointVelocity(worldPoint);
    }
    IsSleeping() { return this._isSleeping; }
    Move(position, rotation) {
        this.MovePosition(position);
        this.MoveRotation(rotation);
    }
    MovePosition(position) { this.position = position; }
    MoveRotation(rotation) { this.rotation = rotation; }
    PublishTransform() {
        this.transform.position = this.position;
        this.transform.rotation = this.rotation;
    }
    ResetCenterOfMass() {
        this.centerOfMass.Clear();
        if (this.collider) {
            const worldCenter = this.collider.worldCenter;
            this.centerOfMass.Set(worldCenter.x, worldCenter.y, worldCenter.z)
        }
    }
    ResetInertiaTensor() { this.inertiaTensor = (2 / 5) * this.mass * 0.5; }
    Sleep() { this._isSleeping = true; }
    SweepTest(direction, maxDistance = Mathf.Infinity, queryTriggerInteraction = QueryTriggerInteraction.UseGlobal, raycastHit = null) {
        raycastHit = raycastHit || new RaycastHit();

        return raycastHit;
    }
    SweepTestAll(direction, maxDistance = Mathf.Infinity, queryTriggerInteraction = QueryTriggerInteraction.UseGlobal) { }
    WakeUp() { this._isSleeping = false; }

}
