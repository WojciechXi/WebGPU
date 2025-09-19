class Test extends Component {

    Update() {
        this.transform.position.x = Math.sin(Time.time) * Math.PI;
        this.transform.position.z = Math.cos(Time.time) * Math.PI;
    }

}