class Input {

    static {
        let object = this;

        object.lastMousePosition = new Vector2(0.5, 0.5);
        object.mousePosition = new Vector2(0.5, 0.5);
        object.mouseMove = new Vector2(0, 0);

        object._keys = {};
        object.keys = {};
        object.axis = {
            Vertical: {
                positive: 'w',
                negative: 's',
                value: 0,
            },
            Horizontal: {
                positive: 'd',
                negative: 'a',
                value: 0,
            },
            Up: {
                positive: 'e',
                negative: 'q',
                value: 0,
            },
        };

        window.addEventListener('beforeunload', function (e) { e.stopPropagation(); e.preventDefault(); return false; }, true);

        window.addEventListener('mousemove', function (event) {
            event.preventDefault();
            event.stopPropagation();
            object.mousePosition.SetXY(event.x, event.y);
        });

        window.addEventListener('mousedown', function (event) {
            event.preventDefault();
            event.stopPropagation();
            object._keys[event.button] = true;
        });

        window.addEventListener('mouseup', function (event) {
            event.preventDefault();
            event.stopPropagation();
            object._keys[event.button] = false;
        });

        window.addEventListener('keydown', function (event) {
            event.preventDefault();
            event.stopPropagation();
            object._keys[event.key.toLowerCase()] = true;
        });

        window.addEventListener('keyup', function (event) {
            event.preventDefault();
            event.stopPropagation();
            object._keys[event.key.toLowerCase()] = false;
        });
    }

    static GetKey(key) {
        return this.keys[key] ? this.keys[key].state : false;
    }

    static GetKeyDown(key) {
        return this.keys[key] ? this.keys[key].down : false;
    }

    static GetKeyUp(key) {
        return this.keys[key] ? this.keys[key].down : false;
    }

    static GetAxis(key) {
        return this.axis[key] ? this.axis[key].value : 0;
    }

    static Update() {
        let object = this;

        object.mouseMove.SetXY(object.mousePosition.x - object.lastMousePosition.x, object.mousePosition.y - object.lastMousePosition.y);
        object.lastMousePosition.SetXY(object.mousePosition.x, object.mousePosition.y);

        Object.keys(object._keys).forEach(function (key) {
            let keyData = object.keys[key] ?? (object.keys[key] = {
                state: object._keys[key],
                down: false,
                up: false,
            });

            if (keyData.state != object._keys[key]) {
                keyData.state = object._keys[key];
                if (keyData.state) keyData.down = true;
                else keyData.up = true;
            } else {
                keyData.down = false;
                keyData.up = false;
            }
        });

        Object.keys(object.axis).forEach(function (key) {
            let value = 0;
            if (object.GetKey(object.axis[key].positive)) value += 1;
            if (object.GetKey(object.axis[key].negative)) value -= 1;
            object.axis[key].value = value;
        });
    }

}