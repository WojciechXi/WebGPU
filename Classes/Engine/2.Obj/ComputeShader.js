class ComputeShader extends Obj {

    constructor() {
        super();
        const object = this;

        new Property(object, 'enableKeywords', false);
        new Property(object, 'keywordSpace', 0);
        new Property(object, 'shaderKeywords', []);
    }

    DisableKeyword() { }
    Dispatch() { }
    DispatchIndirect() { }
    EnableKeyword() { }
    FindKernel() { }
    GetKernelThreadGroupSizes() { }
    HasKernel() { }
    IsKeywordEnabled() { }
    IsSupported() { }
    SetBool() { }
    SetBuffer() { }
    SetConstantBuffer() { }
    SetFloat() { }
    SetFloats() { }
    SetInt() { }
    SetInts() { }
    SetKeyword() { }
    SetMatrix() { }
    SetMatrixArray() { }
    SetMatrix() { }
    SetTexture() { }
    SetTextureFromGlobal() { }
    SetVector() { }
    SetVectorArray() { }

}