class Engine {

    static {
        new Property(this, 'Selection', [], {
            assigned: value => {

            },
        });
    }

    constructor() {
        Engine.Instance = this;
        this._isLooping = false;
        this._lastFrameTime = performance.now();

        Engine.cpuTime = 0;
        Engine.gpuTime = 0;
        Engine.fixedUpdateTime = 0;
        Engine.updateTime = 0;
        Engine.totalTime = 0;

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
            const fixedUpdateBegin = performance.now();
            while (Time.fixedTime > Time.fixedDeltaTime) {
                Time.fixedTime -= Time.fixedDeltaTime;
                for (let c of this.scene.fixedUpdateables) c.FixedUpdate();
            }
            Engine.fixedUpdateTime = (performance.now() - fixedUpdateBegin);

            const updateBegin = performance.now();
            for (let c of this.scene.updateables) c.Update();
            Engine.updateTime = (performance.now() - updateBegin);
            Engine.cpuTime = performance.now() - cpuBegin;

            // GPU
            const gpuBegin = performance.now();
            if (this.renderPipeline) {
                for (let camera of this.scene.cameras) this.renderPipeline.Render(camera, this.scene);
            }
            RenderQueue.Clear();
            Engine.gpuTime = (performance.now() - gpuBegin);

            if (Camera.main && Input.GetKeyDown('Mouse0')) {
                const ray = Camera.main.ScreenPointToRay(Input.mousePosition);
                const newSelection = [];
                for (let component of this.scene.components) {
                    const bounds = component.bounds;
                    if (!bounds || !bounds.IntersectRay(ray)) continue;
                    newSelection.push(component.gameObject);
                }
                Engine.Selection = newSelection;
            }
        }

        Engine.totalTime = performance.now() - cpuBegin;

        window.inspector.innerText =
            `FPS: ${(Time.frames).toFixed(0)} (${(Time.deltaTime * 1000).toFixed(2)}ms interval)\n` +
            `Total time: ${Engine.totalTime.toFixed(2)}ms / 16.6ms\n` +
            `├─ Fixed update: ${(Engine.fixedUpdateTime).toFixed(2)}ms\n` +
            `├─ Update: ${(Engine.updateTime).toFixed(2)}ms\n` +
            `├─ CPU: ${(Engine.cpuTime).toFixed(2)}ms\n` +
            `└─ GPU: ${Engine.gpuTime.toFixed(2)}ms`;

        requestAnimationFrame(time => this.Loop(time));
    }

    Stop() {
        this._isLooping = false;
    }

}