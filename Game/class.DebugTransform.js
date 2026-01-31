class DebugTransform extends MonoBehaviour {

    OnDrawGizmos(renderPass, camera) {
        renderPass.DrawSphere(this.transform.position, 0.125);
    }

}