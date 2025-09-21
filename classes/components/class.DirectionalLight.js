class DirectionalLight extends Component {

    Init() {
        this.color = Color.white;
    }

    Update() {
        Graphics.lightDirection = this.transform.down;
        Graphics.lightColor = this.color;
    }

}