class DirectionalLight extends Light {

    Update() {
        Graphics.lightDirection = this.transform.down;
        Graphics.lightColor = this.color;
    }

}