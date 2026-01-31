class PlayerController extends MonoBehaviour {

    constructor(data, parameters) {
        super(data, {
            ...parameters,
            camera: { value: null },
            rigidbody: { value: null },
            move: { value: Vector3.zero, },
            look: { value: Vector3.zero, },
        });
    }

    OnEnable() {
        this.camera = Camera.main;
        this.rigidbody = this.GetComponent(Rigidbody);
    }

    Update() {
        this.move.x = Input.GetAxis('Horizontal');
        // this.move.y = Input.GetAxis('Up');
        this.move.z = Input.GetAxis('Vertical');
        if (this.move.magnitude > 1.0) this.move.Normalize();

        this.look = this.look.Add(new Vector3(Input.mouseMove.y / 10, Input.mouseMove.x / 10));
        this.look.x = Mathf.Clamp(this.look.x, -75, 75);

        this.camera.transform.eulerAngles = this.look;
        this.camera.transform.position = this.transform.position.Add(this.camera.transform.back.Multiply(3.5).Add(Vector3.up));

        if (this.move.magnitude > 0) this.transform.rotation = Quaternion.RotateTowards(this.transform.rotation, Quaternion.LookRotation(Quaternion.Euler(0, this.look.y, 0).MultiplyVector3(this.move)), 360 * Time.deltaTime);
        this.rigidbody.AddForce(Quaternion.Euler(0, this.look.y, 0).MultiplyVector3(this.move).Multiply(3.5 * 4), ForceMode.Force);
    }

}