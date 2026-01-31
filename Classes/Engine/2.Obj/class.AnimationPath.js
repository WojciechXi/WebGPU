class AnimationPath extends Obj {

    constructor(data = {}, parameters = {}) {
        super(data, {
            ...parameters,
            joint: { value: data._joint ?? data.joint ?? -1 },
            path: { value: data._path ?? data.path ?? '' },
            times: { value: data._times ?? data.times ?? [] },
            values: { value: data._values ?? data.values ?? [] },
        });
    }

}