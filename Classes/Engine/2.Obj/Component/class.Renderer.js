class Renderer extends Component {

    get bounds() { return new Bounds(this.transform.position, Vector3.one); }

    OnPreRender() { }
    Draw(renderPass, camera) { }
    OnPostRender() { }

}