class Time {

    static {
        this.deltaTime = 0;
        this.time = 0;
    }

    static Update(time) {
        this.deltaTime = time - this.time;
        this.time = time;
    }

}