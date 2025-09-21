class Test extends Component {

    Init() {
        this.look = Vector2.zero;
        this.move = Vector3.zero;
    }

    Update() {
        if (Input.GetKey(0))
            this.look.Add(Input.mouseMove.Multiply(Time.deltaTime * 2));

        this.move.x = Input.GetAxis('Horizontal');
        this.move.y = Input.GetAxis('Up');
        this.move.z = Input.GetAxis('Vertical');

        this.transform.rotation = Quaternion.FromEuler(this.look.y, 0, this.look.x);

        let position = this.transform.position;
        position.Add(this.transform.forward.Multiply(this.move.z * Time.deltaTime * 5));
        position.Add(this.transform.up.Multiply(this.move.y * Time.deltaTime * 5));
        position.Add(this.transform.right.Multiply(this.move.x * Time.deltaTime * 5));
        this.transform.position = position;
    }

}