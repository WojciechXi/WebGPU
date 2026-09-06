class Engine {

    constructor() {
        Engine.Instance = this;
        this._isLooping = false;
        this._lastFrameTime = performance.now();

        Engine.cpuWorkTime = 0;
        Engine.gpuSubmitTime = 0;

        new Property(this, 'scene', null);
    }

    async Init(callback) {
        await Graphics.Init(() => callback(this));
    }

    Start() {
        if (this._isLooping) return;
        this._isLooping = true;
        this._lastFrameTime = performance.now();

        Input.Start();

        requestAnimationFrame(time => this.Loop(time));
    }

    Loop(time) {
        if (!this._isLooping) return;

        const now = performance.now();
        Engine.frameTime = now - this._lastFrameTime;
        this._lastFrameTime = now;

        const cpuBegin = performance.now();

        Time.Update(time);
        Input.Update();

        if (this.scene) {
            // CPU
            while (Time.fixedTime > Time.fixedDeltaTime) {
                Time.fixedTime -= Time.fixedDeltaTime;
                for (let c of this.scene.fixedUpdateables) c.FixedUpdate();
            }

            for (let c of this.scene.updateables) c.Update();

            // GPU
            const gpuBegin = performance.now();
            if (this.renderPipeline) {
                for (let camera of this.scene.cameras) this.renderPipeline.Render(camera, this.scene);
            }

            RenderQueue.Clear();

            Engine.gpuSubmitTime = (performance.now() - gpuBegin);
        }
        Engine.cpuWorkTime = performance.now() - cpuBegin;

        window.inspector.innerText =
            `FPS: ${(Time.frames).toFixed(0)} (${(Time.deltaTime * 1000).toFixed(2)}ms interval)\n` +
            `CPU Work: ${Engine.cpuWorkTime.toFixed(2)}ms / 16.6ms\n` +
            `  ├─ Update: ${(Engine.cpuWorkTime - Engine.gpuSubmitTime).toFixed(2)}ms\n` +
            `  └─ Render Submit: ${Engine.gpuSubmitTime.toFixed(2)}ms`;

        requestAnimationFrame(time => this.Loop(time));
    }

    Stop() {
        this._isLooping = false;
    }

}