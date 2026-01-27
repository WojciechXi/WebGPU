class Collision {

    constructor() {
        this.contacts = [];
        this.impulse = null;

        this._articulationBody = null;
        this._body = null;
        this._collider = null;
        this._gameObject = null;
        this._relativeVelocity = null;
        this._rigidbody = null;
        this._transform = null;
    }

    get articulationBody() { }
    get body() { }
    get collider() { }
    get gameObject() { }
    get relativeVelocity() { }
    get rigidbody() { }
    get transform() { }

    GetContact(index) { return this.contacts[index]; }
    GetContacts(contacts) {
        return 0;
    }

}