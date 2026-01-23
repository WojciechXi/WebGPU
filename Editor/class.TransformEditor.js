class TransformEditor {

    static {
        Editor.editors.Transform = this;
    }

    constructor(target) {
        this.target = target;
    }

    Render() {
        const object = this;
        const div = document.createElement('div');
        div.innerHTML = this.target.gameObject.name;
        return div;
    }

}