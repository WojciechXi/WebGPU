class Test extends Component {

    Update() {
        this.transform.rotation = Quaternion.FromAxisAngle(Vector3.up, Time.time * 30);
    }

}