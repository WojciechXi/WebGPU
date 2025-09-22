class Engine {

    constructor(assets) {
        Engine.Instance = this;
        this.assets = assets;
        this.scene = new Scene();
    }

    Init(callback) {
        let object = this;

        Graphics.Init(this.assets, function () {
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
        Input.Update();
        Graphics.Update();

        if (this.scene) this.scene.Update();
        if (this.scene) this.scene.PreRender();

        Graphics.Render(this);

        if (this.scene) this.scene.PostRender();

        requestAnimationFrame(function (time) {
            object.Loop(time);
        });
    }

}