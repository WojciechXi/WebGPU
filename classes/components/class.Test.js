class Test extends Component {

    Update() {
        this.transform.rotation = Quaternion.FromAxisAngle(Vector3.up, Time.time * 30);
        this.transform.position = Vector3.up.Add(this.transform.back.Multiply(5));
    }

}