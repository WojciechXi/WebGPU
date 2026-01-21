class AmbientLight extends Component {

    Init() {
        if (AmbientLight.main == null) AmbientLight.main = this;

        this.color = Color.white;
    }

    Update() {

    }

}