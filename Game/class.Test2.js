class Test2 extends MonoBehaviour {

    Init() {
        this.turn = Vector3.zero;
    }

    Update() {
        this.turn.y += Time.deltaTime * 15.0;

        this.transform.rotation = Quaternion.FromEuler(this.turn.x, this.turn.y, this.turn.z);
    }

}