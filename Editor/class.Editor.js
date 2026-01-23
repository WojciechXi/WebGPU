class Editor {

    static {
        window.addEventListener('DOMContentLoaded', function (event) {
            Editor.Instance = new Editor();
            Editor.Instance.LoadProject();
        });
    }

    constructor() {
        this.editor = document.querySelector('#editor');
        this.inspector = document.querySelector('#inspector');
        this.hierarchy = document.querySelector('#hierarchy');
        this.project = document.querySelector('#project');
        this.view = document.querySelector('#view');

        this.assets = [];
    }

    LoadProject() {

    }

}