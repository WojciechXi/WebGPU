class Test extends Component {

    Update() {
        this.transform.position.x = Math.sin(Time.time) * Math.PI;
        this.transform.position.y = Math.cos(Time.time) * Math.PI;
        this.transform.scale.Set(Math.Lerp(0.5, 1.0, Math.cos(Time.time)));
    }

}