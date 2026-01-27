class Test extends MonoBehaviour {

    Init() {
        this.look = Vector2.zero;
        this.move = Vector3.zero;
        this.ray = null;
        this.rayDistance = 1;
    }

    OnEnable() {
        this.camera = this.GetComponent(Camera);
    }

    Update() {
        if (Input.GetKey(0)) this.look = Vector2.Add(this.look, Input.mouseMove.Multiply(Time.deltaTime * 2));

        this.move.x = Input.GetAxis('Horizontal');
        this.move.y = Input.GetAxis('Up');
        this.move.z = Input.GetAxis('Vertical');

        this.transform.rotation = Quaternion.FromEuler(this.look.y, this.look.x, 0);

        let position = this.transform.position;
        position = Vector3.Add(position, Vector3.Multiply(this.transform.forward, this.move.z * Time.deltaTime * 5));
        position = Vector3.Add(position, Vector3.Multiply(this.transform.up, this.move.y * Time.deltaTime * 5));
        position = Vector3.Add(position, Vector3.Multiply(this.transform.right, this.move.x * Time.deltaTime * 5));
        this.transform.position = position;

        this.ray = this.camera.ScreenPointToRay(Input.mousePosition);
        if (Input.GetKeyDown(0)) {
            const raycastHits = Physics.Raycast(this.ray, 10);
            if (raycastHits.length) {
                const meshRenderer = raycastHits[0].gameObject.GetComponent(MeshRenderer);
                if (meshRenderer) {
                    meshRenderer.materials[0].color = new Color32(Random.Range(0, 0.5), Random.Range(0, 0.5), Random.Range(0, 0.5));
                }
            }
        }
    }

    OnDrawGizmos(renderPass, camera) {
        if (this.ray) renderPass.DrawRay(this.ray);
    }

}