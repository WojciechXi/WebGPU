class AmbientLight extends MonoBehaviour {

    Init() {
        if (AmbientLight.main == null) AmbientLight.main = this;

        this.color = Color32.white;
    }

    Update() {

    }

}