class Transform extends Component {

    Init() {
        this.position = Vector3.zero;
        this.rotation = Quaternion.identity;
        this.scale = Vector3.one;

        this.matrix4x4 = Matrix4x4.Identity();
    }

    Update() {
        Matrix4x4.Identity(this.matrix4x4);
        Matrix4x4.Translate(this.matrix4x4, this.position, this.matrix4x4);
    }

}