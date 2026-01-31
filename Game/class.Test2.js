class Test2 extends MonoBehaviour {

    Init() {
        this.turn = new Vector3(0, 0, 0);
    }

    Update() {
        this.turn.y += Time.deltaTime * 15.0;
        this.transform.rotation = Quaternion.Euler(this.turn.x, this.turn.y, 0);
    }

}