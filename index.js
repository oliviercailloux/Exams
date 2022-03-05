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
var _Controller_instances, _Controller_loginController, _Controller_login, _Controller_requester, _Controller_errors, _Controller_nameElement, _Controller_examPasswordElement, _Controller_startButton, _Controller_errorsElement, _Controller_listNotFound, _Controller_start, _Controller_error, _Controller_gotPersonalExamPassword, _Controller_gotList, _Controller_navigate, _Controller_resetLogin;
import { Requester } from './modules/requester.js';
import { Login, LoginController } from './modules/login.js';
import { asInput, asButton, asElement } from './modules/utils.js';
if (window.location.protocol !== 'https:' && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
    throw new Error('Protocol should be https.');
}
class Controller {
    constructor() {
        _Controller_instances.add(this);
        _Controller_loginController.set(this, void 0);
        _Controller_login.set(this, void 0);
        _Controller_requester.set(this, void 0);
        _Controller_errors.set(this, void 0);
        _Controller_nameElement.set(this, void 0);
        _Controller_examPasswordElement.set(this, void 0);
        _Controller_startButton.set(this, void 0);
        _Controller_errorsElement.set(this, void 0);
        console.log('Building controller.');
        __classPrivateFieldSet(this, _Controller_loginController, new LoginController(), "f");
        __classPrivateFieldSet(this, _Controller_requester, new Requester(), "f");
        __classPrivateFieldSet(this, _Controller_errors, new Array(), "f");
        this.refresh = this.refresh.bind(this);
        __classPrivateFieldSet(this, _Controller_nameElement, asInput(document.getElementById('name')), "f");
        __classPrivateFieldSet(this, _Controller_examPasswordElement, asInput(document.getElementById('exam-password')), "f");
        __classPrivateFieldSet(this, _Controller_startButton, asButton(document.getElementById('start')), "f");
        __classPrivateFieldGet(this, _Controller_startButton, "f").addEventListener('click', __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_start).bind(this));
        __classPrivateFieldSet(this, _Controller_errorsElement, asElement(document.getElementById('errors')), "f");
    }
    refresh() {
        __classPrivateFieldSet(this, _Controller_login, __classPrivateFieldGet(this, _Controller_loginController, "f").readLogin(), "f");
        if (__classPrivateFieldGet(this, _Controller_login, "f") !== undefined) {
            __classPrivateFieldGet(this, _Controller_requester, "f").list(__classPrivateFieldGet(this, _Controller_login, "f")).then(l => l === undefined ? __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_listNotFound).call(this) : __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_gotList).call(this, l));
        }
    }
}
_Controller_loginController = new WeakMap(), _Controller_login = new WeakMap(), _Controller_requester = new WeakMap(), _Controller_errors = new WeakMap(), _Controller_nameElement = new WeakMap(), _Controller_examPasswordElement = new WeakMap(), _Controller_startButton = new WeakMap(), _Controller_errorsElement = new WeakMap(), _Controller_instances = new WeakSet(), _Controller_listNotFound = function _Controller_listNotFound() {
    console.log('List not found, deleting login.');
    __classPrivateFieldGet(this, _Controller_loginController, "f").deleteLogin();
    this.refresh();
}, _Controller_start = function _Controller_start(_event) {
    __classPrivateFieldGet(this, _Controller_startButton, "f").disabled = true;
    __classPrivateFieldGet(this, _Controller_requester, "f").register(__classPrivateFieldGet(this, _Controller_nameElement, "f").value, __classPrivateFieldGet(this, _Controller_examPasswordElement, "f").value)
        .then(pw => __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_gotPersonalExamPassword).call(this, pw)).catch(e => __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_error).bind(this)(`Registration failed: ${e}`));
}, _Controller_error = function _Controller_error(reason) {
    __classPrivateFieldGet(this, _Controller_errors, "f").push(reason);
    __classPrivateFieldGet(this, _Controller_errorsElement, "f").innerHTML = __classPrivateFieldGet(this, _Controller_errors, "f").join('; ');
    __classPrivateFieldGet(this, _Controller_startButton, "f").disabled = false;
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
