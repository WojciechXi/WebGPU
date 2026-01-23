class Time {

    static {
        this.timeScale = 1.0;
        this.deltaTime = 0.0;
        this.time = 0.0;
        this.frames = 0;
    }

    static Update(time) {
        this.deltaTime = (time - this.time) * this.timeScale;
        this.frames = 1 / this.deltaTime;
        this.time = time;
    }

}