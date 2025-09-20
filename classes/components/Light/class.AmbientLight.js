class AmbientLight extends Light {

    Update() {
        Graphics.ambientLightColor = this.color;
    }

}