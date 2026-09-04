class ObjectReference {

    constructor(fileId = 0, guid = '', type = ObjectReferenceType.GameObject) {
        this.fileId = fileId;
        this.guid = guid;
        this.type = type;
    }

}

const ObjectReferenceType = {
    GameObject: 0,
    Component: 1,
    Asset: 2,
    Prefab: 3,
    GameBehaviour: 4,
};