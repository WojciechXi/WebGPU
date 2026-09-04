class RenderSettings extends Obj {

    constructor() {
        super();
        const object = this;

        new Property(object, 'fog', 0);
        new Property(object, 'fogColor', Color32.gray);
        new Property(object, 'fogDensity', 0.01);
        new Property(object, 'linearFogStart', 0);
        new Property(object, 'linearFogEnd', 300);
        new Property(object, 'ambientSkyColor', new Color32(0.212, 0.227, 0.259, 1));
        new Property(object, 'ambientEquatorColor', new Color32(0.114, 0.125, 0.133, 1));
        new Property(object, 'ambientGroundColor', new Color32(0.047, 0.043, 0.035, 1));
        new Property(object, 'ambientIntensity', 1);
        new Property(object, 'ambientMode', 0);
        new Property(object, 'subtractiveShadowColor', new Color32(0.42, 0.478, 0.627, 1));
        new Property(object, 'skyboxMaterial', null);
        new Property(object, 'haloStrenth', 0.5);
        new Property(object, 'flareStrength', 1);
        new Property(object, 'flareFadeSpeed', 3);
        new Property(object, 'haloTexture', null);
        new Property(object, 'spotCookie', null);
        new Property(object, 'defaultReflectionMode', 0);
        new Property(object, 'defaultReflectionResolution', 128);
        new Property(object, 'reflectionBounces', 1);
        new Property(object, 'reflectionIntensity', 1);
        new Property(object, 'sun', null);
        new Property(object, 'useRadianceAmbientProbe', 0);
    }

}