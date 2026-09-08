class Behaviour extends Component {

    constructor() {
        super();
        const object = this;

        new Property(object, 'enabled', false);
    }

    /* Unity */

    // Properties
    get isActiveAndEnabled() { return this.enabled && this.gameObject.activeInHierarchy; }

}