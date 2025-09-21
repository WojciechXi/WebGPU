class Test extends Component {

    Update() {
        this.transform.rotation = Quaternion.FromEuler((Input.mousePosition.y - 0.5) * 180, 0, (Input.mousePosition.x - 0.5) * 180);
        this.transform.position = Vector3.up.Add(this.transform.back.Multiply(5));
    }

}