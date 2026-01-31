class File extends Obj {

    constructor(data = {}, parameters = {}) {
        super(data, {
            ...parameters,
            fileId: { value: data._fileId ?? data.fileId ?? 0 },
            guid: { value: data._guid ?? data.guid ?? 0 },
            type: { value: data._type ?? data.type ?? 0 },
        });
    }

}

const FileType = {
    GameObject: 0,
    Component: 1,
    Asset: 2,
    Prefab: 3,
    MonoBehaviour: 4,
};