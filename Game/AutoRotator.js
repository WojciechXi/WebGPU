class AutoRotator extends GameBehaviour {

    constructor() {
        super();

        this.eulerAngles = new Vector3(180, 0, 0);
    }

    Update() {
        this.eulerAngles.y += 15.0 * Time.deltaTime;
        this.transform.eulerAngles = this.eulerAngles;
    }

}