class Animation extends Obj {

    constructor(data = {}, parameters = {}) {
        super(data, {
            ...parameters,
            animationPaths: { value: data._animationPaths ?? data.animationPaths ?? [] },
        });
    }

}