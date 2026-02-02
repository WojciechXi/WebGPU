class Engine {

    constructor() {
        Engine.Instance = this;
        this.scene = new Scene();
    }

    Init(callback) {
        let object = this;

        Graphics.Init(function () {
            callback(object);
        });
    }

    Awake() {
        Graphics.Awake();
    }

    Start() {
        let object = this;

        requestAnimationFrame(function (time) {
            Input.Start();
            object.Loop(time);
        });
    }

    Loop(time) {
        let object = this;

        Time.Update(time / 1000);
        Input.Update();

        if (Time.fixedTime > Time.fixedDeltaTime) {
            Time.fixedTime -= Time.fixedDeltaTime;
            if (this.scene) for (let c of this.scene.fixedUpdateables) c.FixedUpdate();
        }
        if (this.scene) for (let c of this.scene.updateables) c.Update();

        Graphics.Render(this.scene);

        requestAnimationFrame(function (time) {
            object.Loop(time);
        });
    }

}