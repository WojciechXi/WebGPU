class Input {

    static {
        let _this = this;

        _this.mousePosition = new Vector2(0.5, 0.5);
        _this.mouseMove = new Vector2(0, 0);

        _this._keys = {};
        _this.keys = {};
        _this.axis = {
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
            _this.mousePosition.SetXY(event.x / window.innerWidth, event.y / window.innerHeight);
            _this.mouseMove.SetXY(event.movementX, event.movementY);
        });

        window.addEventListener('mousedown', function (event) {
            event.preventDefault();
            _this._keys[event.button] = true;
        });

        window.addEventListener('mouseup', function (event) {
            event.preventDefault();
            _this._keys[event.button] = false;
        });

        window.addEventListener('keydown', function (event) {
            event.preventDefault();
            _this._keys[event.key.toLowerCase()] = true;
        });

        window.addEventListener('keyup', function (event) {
            event.preventDefault();
            _this._keys[event.key.toLowerCase()] = false;
        });
    }

    static GetKey(key) {
        return this.keys[key] ? this.keys[key].state : false;
    }

    static GetAxis(key) {
        return this.axis[key] ? this.axis[key].value : 0;
    }

    static Update() {
        let _this = this;
        Object.keys(_this._keys).forEach(function (key) {
            let keyData = _this.keys[key] ?? (_this.keys[key] = {
                state: _this._keys[key],
                down: false,
                up: false,
            });

            if (keyData.state != _this._keys[key]) {
                keyData.state = _this._keys[key];
                if (keyData.state) keyData.down = true;
                else keyData.up = true;
            } else {
                keyData.down = false;
                keyData.up = false;
            }
        });

        Object.keys(_this.axis).forEach(function (key) {
            let value = 0;
            if (_this.GetKey(_this.axis[key].positive)) value += 1;
            if (_this.GetKey(_this.axis[key].negative)) value -= 1;
            _this.axis[key].value = value;
        });
    }

}