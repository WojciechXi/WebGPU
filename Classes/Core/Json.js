class Json {

    static FromJson(json) {
        return JSON.parse(json);
    }

    static ToJson(obj, prettyPrint = true) {
        return prettyPrint ? JSON.stringify(obj, null, 5) : JSON.stringify(obj);
    }

}