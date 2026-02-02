class VoxelController extends MonoBehaviour {

    constructor(data = {}, parameters = {}) {
        super(data, {
            ...parameters,
            radius: { value: 0.25, },
            center: { value: new Vector3(0, 0.6, 0), },
            height: { value: 1.2 },
        });

        this.look = Vector2.zero;
        this.move = Vector3.zero;
        this.velocity = Vector3.zero;
        this.inspector = document.querySelector('#inspector');
    }

    Update() {
        this.look = this.look.Add(Vector2.Multiply(Input.mouseMove, Time.deltaTime * 10));
        this.look.y = Mathf.Clamp(this.look.y, -75, 75);

        this.move.x = Input.GetAxis('Horizontal');
        this.move.z = Input.GetAxis('Vertical');
        if (this.move.magnitude > 1) this.move.Normalize();

        this.transform.rotation = Quaternion.Euler(this.look.y, this.look.x, 0);
    }

    FixedUpdate() {
        if (!VoxelWorldComponent.Instance) return;
        VoxelWorldComponent.Instance.position = this.transform.position.Divide(16).Floor();

        let position = this.transform.position;
        let deltaGravity = Vector3.Multiply(Physics.gravity, Time.fixedDeltaTime);

        this.velocity = this.velocity.Add(deltaGravity);

        // Przewidywana nowa pozycja (tylko wertykalnie dla testu kolizji)
        let nextPos = Vector3.Add(position, Vector3.Multiply(this.velocity, Time.fixedDeltaTime));

        // Ruch horyzontalny (z rotacją kamery)
        let moveDir = Quaternion.Euler(0, this.look.x, 0).MultiplyVector3(this.move);
        nextPos = nextPos.Add(moveDir.Multiply(3.5 * Time.fixedDeltaTime));

        // KOLIZJA Z PODŁOGĄ (Uwzględniając ISO)
        // Sprawdzamy punkt pod stopami gracza
        const feetPosition = Vector3.Subtract(nextPos, new Vector3(0, 0.1, 0)); // mały offset w dół

        const voxel = VoxelWorldComponent.Instance.GetVoxel(feetPosition);
        if (voxel == null) {
            this.transform.position = position;
        } else if (voxel.isSolid) {
            this.velocity.y = Math.max(0, this.velocity.y);
            nextPos.y = position.y + Time.fixedDeltaTime;
        }

        this.transform.position = nextPos;

        this.inspector.innerHTML = voxel;
    }

}