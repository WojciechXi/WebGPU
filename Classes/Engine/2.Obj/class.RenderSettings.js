class RenderSettings extends Obj {

    constructor(data = {}, parameters = {}) {
        super(data, {
            ...parameters,
            fog: { value: 0 },
            fogColor: { value: Color32.gray, },
            fogDensity: { value: 0.01, },
            linearFogStart: { value: 0, },
            linearFogEnd: { value: 300, },
            ambientSkyColor: { value: new Color32(0.212, 0.227, 0.259, 1), },
            ambientEquatorColor: { value: new Color32(0.114, 0.125, 0.133, 1), },
            ambientGroundColor: { value: new Color32(0.047, 0.043, 0.035, 1), },
            ambientIntensity: { value: 1, },
            ambientMode: { value: 0, },
            subtractiveShadowColor: { value: new Color32(0.42, 0.478, 0.627, 1), },
            skyboxMaterial: { value: null, },
            haloStrenth: { value: 0.5, },
            flareStrength: { value: 1, },
            flareFadeSpeed: { value: 3, },
            haloTexture: { value: null, },
            spotCookie: { value: null, },
            defaultReflectionMode: { value: 0, },
            defaultReflectionResolution: { value: 128, },
            reflectionBounces: { value: 1, },
            reflectionIntensity: { value: 1, },
            sun: { value: null, },
            useRadianceAmbientProbe: { value: 0, },
        });
    }

}