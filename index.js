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
var _Controller_instances, _Controller_loginController, _Controller_login, _Controller_requester, _Controller_nameElement, _Controller_examPasswordElement, _Controller_startButton, _Controller_start, _Controller_gotPersonalExamPassword, _Controller_gotList, _Controller_navigate, _Controller_resetLogin;
import { Requester } from './modules/requester.js';
import { Login, LoginController } from './modules/login.js';
import { asInput, asButton } from './modules/utils.js';
if (window.location.protocol !== 'https:' && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
    throw new Error('Protocol should be https.');
}
class Controller {
    constructor() {
        _Controller_instances.add(this);
        _Controller_loginController.set(this, void 0);
        _Controller_login.set(this, void 0);
        _Controller_requester.set(this, void 0);
        _Controller_nameElement.set(this, void 0);
        _Controller_examPasswordElement.set(this, void 0);
        _Controller_startButton.set(this, void 0);
        console.log('Building controller.');
        __classPrivateFieldSet(this, _Controller_loginController, new LoginController(), "f");
        __classPrivateFieldSet(this, _Controller_requester, new Requester(), "f");
        this.refresh = this.refresh.bind(this);
        __classPrivateFieldSet(this, _Controller_nameElement, asInput(document.getElementById('name')), "f");
        __classPrivateFieldSet(this, _Controller_examPasswordElement, asInput(document.getElementById('exam-password')), "f");
        __classPrivateFieldSet(this, _Controller_startButton, asButton(document.getElementById('start')), "f");
        __classPrivateFieldGet(this, _Controller_startButton, "f").addEventListener('click', __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_start).bind(this));
    }
    refresh() {
        __classPrivateFieldSet(this, _Controller_login, __classPrivateFieldGet(this, _Controller_loginController, "f").readLogin(), "f");
        if (__classPrivateFieldGet(this, _Controller_login, "f") !== undefined) {
            __classPrivateFieldGet(this, _Controller_requester, "f").list(__classPrivateFieldGet(this, _Controller_login, "f")).then(__classPrivateFieldGet(this, _Controller_instances, "m", _Controller_gotList).bind(this));
        }
    }
}
_Controller_loginController = new WeakMap(), _Controller_login = new WeakMap(), _Controller_requester = new WeakMap(), _Controller_nameElement = new WeakMap(), _Controller_examPasswordElement = new WeakMap(), _Controller_startButton = new WeakMap(), _Controller_instances = new WeakSet(), _Controller_start = function _Controller_start(_event) {
    __classPrivateFieldGet(this, _Controller_requester, "f").register(__classPrivateFieldGet(this, _Controller_nameElement, "f").value, __classPrivateFieldGet(this, _Controller_examPasswordElement, "f").value || "ep")
        .then(__classPrivateFieldGet(this, _Controller_instances, "m", _Controller_gotPersonalExamPassword).bind(this));
}, _Controller_gotPersonalExamPassword = function _Controller_gotPersonalExamPassword(personalExamPassword) {
    const login = new Login(__classPrivateFieldGet(this, _Controller_nameElement, "f").value, personalExamPassword);
    __classPrivateFieldGet(this, _Controller_loginController, "f").write(login);
    this.refresh();
}, _Controller_gotList = function _Controller_gotList(list) {
    console.log('Got list', list);
    __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_navigate).call(this, list.values().next().value);
}, _Controller_navigate = function _Controller_navigate(id) {
    const target = `exam.html?${id}`;
    console.log('Navigating to', target);
    window.location.href = target;
}, _Controller_resetLogin = function _Controller_resetLogin() {
    __classPrivateFieldGet(this, _Controller_loginController, "f").deleteLogin();
};
new Controller().refresh();
