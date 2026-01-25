class Random {

    static Range(min, max) {
        return Mathf.Lerp(min, max, Mathf.Random());
    }

}