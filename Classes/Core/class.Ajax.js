class Ajax {

    static Get(url, success) {
        let xhr = new XMLHttpRequest();
        xhr.onload = function (event) {
            success(xhr.responseText);
        };

        xhr.open('GET', url, true);
        xhr.send();
    }

}