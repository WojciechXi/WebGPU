class ComputeShader extends Obj {

    constructor(data = {}, parameters = {}) {
        super(data, {
            ...parameters,
            enableKeywords: { value: data._enableKeywords ?? data.enableKeywords ?? false, },
            keywordSpace: { value: data._keywordSpace ?? data.keywordSpace ?? 0, },
            shaderKeywords: { value: data._shaderKeywords ?? data.shaderKeywords ?? [], },
        })
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