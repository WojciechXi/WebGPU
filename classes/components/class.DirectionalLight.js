class DirectionalLight extends Component {

    Init() {

    }

    Update() {
        Graphics.directionalLightDirection = this.transform.down;
    }

}