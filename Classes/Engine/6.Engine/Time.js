class Time {

    static {
        this.timeScale = 1.0;

        this.deltaTime = 0.0;
        this.fixedDeltaTime = 0.02;

        this.time = 0.0;
        this.fixedTime = 0.0;

        this.frames = 0;
    }

    static Update(timeMs) {
        this.deltaTime = ((timeMs - this.time) * this.timeScale) / 1000;
        this.frames = 1 / this.deltaTime;

        this.fixedTime += Mathf.Min(this.deltaTime, 0.25);
        this.time = timeMs;
    }

}