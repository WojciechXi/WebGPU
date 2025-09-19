class Transform extends Component {

    Init() {
        this.position = Vector3.zero;
        this.rotation = Quaternion.identity;
        this.scale = Vector3.one;

        this.parent = null;
        this.children = [];

        this.matrix4x4 = Matrix4x4.Identity();
    }

    ClearParent() {
        if (this.parent) {
            let index = this.parent.children.indexOf(this);
            this.parent.children.splice(index, 1);
            this.parent = null;
        }
    }

    SetParent(newParent) {
        this.ClearParent();
        if (newParent) newParent.children.push(this);
        this.parent = newParent;
    }

    Update() {
        Matrix4x4.Identity(this.matrix4x4);
        Matrix4x4.Translate(this.matrix4x4, this.position, this.matrix4x4);
        Matrix4x4.Scale(this.matrix4x4, this.scale, this.matrix4x4);
    }

}