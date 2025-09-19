class Engine {

    constructor() {
        this.graphics = new Graphics();
        this.scene = new Scene();
    }

    Start() {
        let object = this;

        this.scene.Start();

        requestAnimationFrame(function (time) {
            object.Loop(time);
        });
    }

    Loop(time) {
        let object = this;

        this.scene.Loop();

        requestAnimationFrame(function (time) {
            object.Loop(time);
        });
    }

}