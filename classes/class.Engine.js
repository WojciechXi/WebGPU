class Engine {

    constructor() {
        Engine.Instance = this;
        this.scene = new Scene();
    }

    Init(callback) {
        let object = this;

        Graphics.Init(function () {
            callback(object);
            object.Start();
        });
    }

    Start() {
        let object = this;
        if (this.scene) this.scene.Start();

        requestAnimationFrame(function (time) {
            object.Loop(time);
        });
    }

    Loop(time) {
        let object = this;

        Time.Update(time / 1000);
        Graphics.Update();

        if (this.scene) this.scene.Update();
        if (this.scene) this.scene.PreRender();
        if (this.scene) this.scene.Render();
        if (this.scene) this.scene.PostRender();

        requestAnimationFrame(function (time) {
            object.Loop(time);
        });
    }

}