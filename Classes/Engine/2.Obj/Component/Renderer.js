class Renderer extends Component {

    get isVisible() { return false; }

    constructor() {
        super();
        const object = this;

        new Property(object, 'bounds', new Bounds(Vector3.zero, Vector3.zero)); //The bounding box of the renderer in world space.
        new Property(object, 'enabled', true); //Makes the rendered 3D object visible if enabled.
        new Property(object, 'isVisible', true); //Is this renderer visible in any camera? (Read Only)
        new Property(object, 'localBounds', new Bounds(Vector3.zero, Vector3.zero)); //The bounding box of the renderer in local space.
        new Property(object, 'localToWorldMatrix', Matrix4x4.identity); //Matrix that transforms a point from local space into world space (Read Only).
        new Property(object, 'receiveShadows', true); //Does this object receive shadows?
        new Property(object, 'rendererPriority', 0); //This value sorts renderers by priority. Lower values are rendered first and higher values are rendered last.
        new Property(object, 'renderingLayerMask', 0); //Determines which rendering layer this renderer lives on, if you use a scriptable render pipeline.
        new Property(object, 'shadowCastingMode', true); //Does this object cast shadows?
        new Property(object, 'sortingLayerID', 0); //Unique ID of the Renderer's sorting layer.
        new Property(object, 'sortingOrder', 0); //Renderer's order within a sorting layer.
        new Property(object, 'staticShadowCaster', false); //Is this renderer a static shadow caster?
        new Property(object, 'worldToLocalMatrix', Matrix4x4.identity); //Matrix that transforms a point from world space into local space (Read Only).

        new Property(object, 'mesh', null);
        new Property(object, 'sharedMesh', null, {
            assigned: function () {
                object.ResetLocalBounds();
            },
        });

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
    }

    get isVisible() { return this.materials.length && this.sharedMesh; }

    ResetLocalBounds() { this.localBounds = this.sharedMesh ? this.sharedMesh.bounds.Clone() : new Bounds(Vector3.zero, Vector3.zero); }
    ResetBounds() { }

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

}