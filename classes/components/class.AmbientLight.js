class AmbientLight extends Component {

    Init() {
        this.color = Color.white;
    }

    Update() {
        Graphics.ambientLightColor = this.color;
    }

}