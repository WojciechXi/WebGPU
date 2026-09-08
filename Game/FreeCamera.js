class FreeCamera extends GameBehaviour {

    constructor() {
        super();

        new Property(this, 'view', Vector3.zero);
        new Property(this, 'move', Vector3.zero);
        new Property(this, 'moveRelative', Vector3.zero);
    }

    Update() {
        this.view.x += Input.mouseMove.y * 0.1;
        this.view.y += Input.mouseMove.x * 0.1;

        this.move.z = Input.GetAxis("Vertical");
        this.move.y = Input.GetAxis("Up");
        this.move.x = Input.GetAxis("Horizontal");

        this.transform.eulerAngles = this.view;
        Quaternion.MultiplyVector3(this.transform.rotation, this.move, this.moveRelative);
        this.transform.position = Vector3.Add(this.transform.position, Vector3.Multiply(this.moveRelative, Time.deltaTime * 3.5));
    }

}