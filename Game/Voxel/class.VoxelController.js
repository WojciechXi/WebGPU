class VoxelController extends MonoBehaviour {

    constructor(data = {}, parameters = {}) {
        super(data, {
            ...parameters,
            radius: { value: 0.25, },
            center: { value: new Vector3(0, 1, 0), },
            height: { value: 1.2 },
        });

        this.look = Vector2.zero;
        this.move = Vector3.zero;
        this.velocity = Vector3.zero;
        this.inspector = document.querySelector('#inspector');
    }

    OnEnable() {
        this.camera = Camera.main;
    }

    Update() {
        this.look = this.look.Add(Vector2.Multiply(Input.mouseMove, Time.deltaTime * 10));
        this.look.y = Mathf.Clamp(this.look.y, -75, 75);

        this.move.x = Input.GetAxis('Horizontal');
        this.move.z = Input.GetAxis('Vertical');
        if (this.move.magnitude > 1) this.move.Normalize();

        this.transform.rotation = Quaternion.Euler(0, this.look.x, 0);

        this.camera.transform.position = this.transform.position.Add(Vector3.up);
        this.camera.transform.rotation = Quaternion.Euler(this.look.y, this.look.x, 0);
    }

    FixedUpdate() {
        if (!VoxelWorldComponent.Instance) return;

        let position = this.transform.position;
        VoxelWorldComponent.Instance.position = Vector3.Divide(position, 16).Floor();

        let deltaGravity = Physics.gravity.Multiply(Time.fixedDeltaTime);
        this.velocity = this.velocity.Add(deltaGravity);

        let moveDirection = Quaternion.Euler(0, this.look.x, 0).MultiplyVector3(this.move).Multiply(3.5);
        let finalVelocity = Vector3.Add(this.velocity, moveDirection).Multiply(Time.fixedDeltaTime);

        // 1. Obliczamy pożądaną nową pozycję
        let nextPosition = Vector3.Add(position, finalVelocity);

        // 2. Punkt sprawdzania kolizji (stopy)
        // Używamy offsetu opartego na Twoim 'center' i 'height', powiedzmy -0.1 poniżej stóp
        const feetPosition = Vector3.Subtract(nextPosition, new Vector3(0, 0.1, 0));

        const voxel = VoxelWorldComponent.Instance.GetVoxel(feetPosition);
        // this.inspector.innerHTML = voxel;

        if (voxel && voxel.blockId > 0 && voxel.iso >= 0.5) {
            this.velocity.y = 0;
            const surfaceOffset = (voxel.iso - 0.5) * 0.5;

            const vWorldPos = VoxelWorldComponent.Instance.GetVoxelWorldPosition(feetPosition);
            nextPosition.y = Mathf.Max(vWorldPos.y + surfaceOffset, nextPosition.y);
            this.transform.position = nextPosition;

            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }

        // 3. Obsługa braku danych (Krawędź świata)
        if (voxel === null) {
            // Blokujemy ruch, jeśli nie ma danych o voxelu (np. niezaładowany chunk)
            this.transform.position = position;
            return;
        }

        this.transform.position = nextPosition;
    }

}