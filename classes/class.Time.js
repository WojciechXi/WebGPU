class Time {

    static Update(time) {
        this.deltaTime = time - this.time;
        this.time = time;
    }

}