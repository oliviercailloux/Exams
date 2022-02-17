var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Login_instances, _Login_username, _Login_password, _Login_stringToUtf8ByteArray, _Login_stringToUtf8ToBase64, _LoginController_localStorage;
export class Login {
    constructor(username, password) {
        _Login_instances.add(this);
        _Login_username.set(this, void 0);
        _Login_password.set(this, void 0);
        __classPrivateFieldSet(this, _Login_username, username, "f");
        __classPrivateFieldSet(this, _Login_password, password, "f");
    }
    ;
    get username() {
        return __classPrivateFieldGet(this, _Login_username, "f");
    }
    get password() {
        return __classPrivateFieldGet(this, _Login_password, "f");
    }
    get credentials() {
        const credentials = `${__classPrivateFieldGet(this, _Login_instances, "m", _Login_stringToUtf8ToBase64).call(this, __classPrivateFieldGet(this, _Login_username, "f"))}:${__classPrivateFieldGet(this, _Login_instances, "m", _Login_stringToUtf8ToBase64).call(this, __classPrivateFieldGet(this, _Login_password, "f"))}`;
        return window.btoa(credentials);
    }
}
_Login_username = new WeakMap(), _Login_password = new WeakMap(), _Login_instances = new WeakSet(), _Login_stringToUtf8ByteArray = function _Login_stringToUtf8ByteArray(str) {
    let out = [], p = 0;
    for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        if (c < 128) {
            out[p++] = c;
        }
        else if (c < 2048) {
            out[p++] = (c >> 6) | 192;
            out[p++] = (c & 63) | 128;
        }
        else if (((c & 0xFC00) == 0xD800) && (i + 1) < str.length &&
            ((str.charCodeAt(i + 1) & 0xFC00) == 0xDC00)) {
            // Surrogate Pair
            c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
            out[p++] = (c >> 18) | 240;
            out[p++] = ((c >> 12) & 63) | 128;
            out[p++] = ((c >> 6) & 63) | 128;
            out[p++] = (c & 63) | 128;
        }
        else {
            out[p++] = (c >> 12) | 224;
            out[p++] = ((c >> 6) & 63) | 128;
            out[p++] = (c & 63) | 128;
        }
    }
    return out;
}, _Login_stringToUtf8ToBase64 = function _Login_stringToUtf8ToBase64(input) {
    const utf8 = __classPrivateFieldGet(this, _Login_instances, "m", _Login_stringToUtf8ByteArray).call(this, input);
    let result = '';
    for (let i = 0; i < utf8.length; i++) {
        result += String.fromCharCode(utf8[i]);
    }
    const encoded = window.btoa(result);
    return encoded;
};
export class LoginController {
    constructor() {
        _LoginController_localStorage.set(this, void 0);
        this.readLogin = this.readLogin.bind(this);
        this.write = this.write.bind(this);
        this.deleteLogin = this.deleteLogin.bind(this);
        __classPrivateFieldSet(this, _LoginController_localStorage, window.localStorage, "f");
    }
    readLogin() {
        const username = __classPrivateFieldGet(this, _LoginController_localStorage, "f").getItem('username');
        const password = __classPrivateFieldGet(this, _LoginController_localStorage, "f").getItem('password');
        const hasUsername = username != null;
        const hasPassword = password != null;
        if (hasUsername !== hasPassword)
            throw new Error("Bad local login state.");
        if (!hasUsername) {
            return undefined;
        }
        return new Login(username, password);
    }
    write(login) {
        __classPrivateFieldGet(this, _LoginController_localStorage, "f").setItem('username', login.username);
        __classPrivateFieldGet(this, _LoginController_localStorage, "f").setItem('password', login.password);
    }
    deleteLogin() {
        __classPrivateFieldGet(this, _LoginController_localStorage, "f").removeItem('username');
        __classPrivateFieldGet(this, _LoginController_localStorage, "f").removeItem('password');
    }
}
_LoginController_localStorage = new WeakMap();
export class LoginGenerator {
    static generateLogin(username = 'current time') {
        const password = 'generated password';
        return new Login(username, password);
    }
}
