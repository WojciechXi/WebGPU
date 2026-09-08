class Renderer extends Component {

    get isVisible() { return false; }

    constructor() {
        super();
        const object = this;

        new Property(object, 'enabled', true); //Makes the rendered 3D object visible if enabled.
        new Property(object, 'isVisible', true); //Is this renderer visible in any camera? (Read Only)
        new Property(object, 'receiveShadows', true); //Does this object receive shadows?
        new Property(object, 'rendererPriority', 0); //This value sorts renderers by priority. Lower values are rendered first and higher values are rendered last.
        new Property(object, 'renderingLayerMask', 0); //Determines which rendering layer this renderer lives on, if you use a scriptable render pipeline.
        new Property(object, 'shadowCastingMode', true); //Does this object cast shadows?
        new Property(object, 'sortingLayerID', 0); //Unique ID of the Renderer's sorting layer.
        new Property(object, 'sortingOrder', 0); //Renderer's order within a sorting layer.
        new Property(object, 'staticShadowCaster', false); //Is this renderer a static shadow caster?

        new Property(object, 'mesh', null);
        new Property(object, 'sharedMesh', null);

        new Property(object, 'materials', []); //Returns all the instantiated materials of this object.
        new Property(object, 'material', null, {
            get: function () { return object.materials[0] ?? null; },
            set: function (value) { return object.materials[0] = value; },
        }); //Returns the first instantiated Material assigned to the renderer.

        new Property(object, 'sharedMaterials', []); //All the shared materials of this object.
        new Property(object, 'sharedMaterial', null, {
            get: function () { return object.sharedMaterials[0] ?? null; },
            set: function (value) { return object.sharedMaterials[0] = value; },
        }); //The shared material of this object.

        new Property(object, 'matrixBuffer', new Buffer(16, { usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST }));
    }

    get localToWorldMatrix() {
        const localMatrix = Matrix4.TRS(this.position, this.rotation, this.scale);
        return this.parent ? Matrix4.Multiply(this.parent.localToWorldMatrix, localMatrix) : localMatrix;
    }

    get worldToLocalMatrix() {
        return Matrix4.Invert(this.localToWorldMatrix);
    }

    get localBounds() {
        return this.sharedMesh ? this.sharedMesh.bounds.Clone() : new Bounds(Vector3.zero, Vector3.zero);
    }

    get bounds() {
        const localB = this.localBounds;
        const lMin = localB.min;
        const lMax = localB.max;

        const corners = [
            new Vector3(lMin.x, lMin.y, lMin.z),
            new Vector3(lMax.x, lMin.y, lMin.z),
            new Vector3(lMin.x, lMax.y, lMin.z),
            new Vector3(lMax.x, lMax.y, lMin.z),
            new Vector3(lMin.x, lMin.y, lMax.z),
            new Vector3(lMax.x, lMin.y, lMax.z),
            new Vector3(lMin.x, lMax.y, lMax.z),
            new Vector3(lMax.x, lMax.y, lMax.z)
        ];

        const m = this.localToWorldMatrix;

        const worldCorner0 = Matrix4x4.MultiplyVector3(m, corners[0]);
        const wMin = worldCorner0.Clone();
        const wMax = worldCorner0.Clone();

        for (let i = 1; i < 8; i++) {
            const wP = Matrix4x4.MultiplyVector3(m, corners[i]);

            if (wP.x < wMin.x) wMin.x = wP.x;
            if (wP.y < wMin.y) wMin.y = wP.y;
            if (wP.z < wMin.z) wMin.z = wP.z;

            if (wP.x > wMax.x) wMax.x = wP.x;
            if (wP.y > wMax.y) wMax.y = wP.y;
            if (wP.z > wMax.z) wMax.z = wP.z;
        }

        const center = Vector3.Multiply(Vector3.Add(wMin, wMax), 0.5);
        const size = Vector3.Subtract(wMax, wMin);

        return new Bounds(center, size);
    }

    get isVisible() { return this.materials.length && this.sharedMesh; }

    GetMaterials() { }
    GetPropertyBlock() { }
    GetSharedMaterials() { }
    HasPropertyBlock() { }
    SetMaterials() { }
    SetPropertyBlock() { }
    SetSharedMaterials() { }

    // Messages
    // OnBecameInvisible() { }
    // OnBecameVisible() { }

    Update() {
        if (!this.sharedMesh) return;
        this.matrixBuffer.Set({ 0: this.transform.matrix4x4, });
        for (let i = 0; i < this.sharedMaterials.length; i++) {
            RenderQueue.Submit(this.sharedMesh, this.matrixBuffer.buffer, this.sharedMaterials[i] ?? Engine.emptyMaterial, this.gameObject.layer, null, i, this.shadowCastingMode, this.receiveShadows, this.bounds);
        }
    }

}