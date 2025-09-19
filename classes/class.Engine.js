class Engine {

    constructor() {
        Engine.Instance = this;
        this.Init();
    }

    Init() {
        let object = this;

        this.scene = new Scene();
        this.graphics = new Graphics();

        this.graphics.Init(function () {
            object.Start();
        });
    }

    Start() {
        let object = this;
        if (this.scene) this.scene.Start();

        main(function (renderer) {
            object.renderer = renderer;
            requestAnimationFrame(function (time) {
                object.Update(time);
            });
        });
    }

    Update(time) {
        let object = this;

        if (this.scene) this.scene.Update();

        object.renderer();

        requestAnimationFrame(function (time) {
            object.Update(time);
        });
    }

}