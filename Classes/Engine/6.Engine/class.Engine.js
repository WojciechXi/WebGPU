class Engine {

    constructor() {
        Engine.Instance = this;

        new Property(this, 'scene', null);
    }

    Init(callback) {
        let object = this;

        Graphics.Init(function () {
            callback(object);
        });
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

        if (this.scene) {
            if (Time.fixedTime > Time.fixedDeltaTime) {
                Time.fixedTime -= Time.fixedDeltaTime;
                for (let c of this.scene.fixedUpdateables) c.FixedUpdate();
            }

            for (let c of this.scene.updateables) c.Update();

            if (this.renderPipeline) {
                for (let camera of this.scene.cameras) this.renderPipeline.Render(camera, this.scene);
            }

            RenderQueue.Clear();
        }

        requestAnimationFrame(function (time) {
            object.Loop(time);
        });
    }

}