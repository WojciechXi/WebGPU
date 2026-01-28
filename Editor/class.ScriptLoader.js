class ScriptLoader {

    static async Load(code) {
        const blob = new Blob([jsCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        try {
            const module = await import(url);
            URL.revokeObjectURL(url);
            return module;
        } catch (e) {
            console.error("Błąd kompilacji skryptu z bazy:", e);
            URL.revokeObjectURL(url);
            return null;
        }
    }

}