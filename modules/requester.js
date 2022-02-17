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
var _Requester_instances, _a, _Requester_url, _Requester_getFetchInit, _Requester_getErrorHandlerExpecting, _Requester_getQuestionElements;
import { asSetOfIntegersOrThrow } from './utils.js';
import { Login } from './login.js';
export class Requester {
    constructor() {
        _Requester_instances.add(this);
        _Requester_url.set(this, void 0);
        /* Thanks to https://stackoverflow.com/a/57949518/. */
        const isLocalhost = window.location.hostname === 'localhost' ||
            // [::1] is the IPv6 localhost address.
            window.location.hostname === '[::1]' ||
            // 127.0.0.1/8 is considered localhost for IPv4.
            (window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/) !== null);
        if (isLocalhost) {
            __classPrivateFieldSet(this, _Requester_url, `http://${window.location.hostname}:8080/v0/`, "f");
        }
        else {
            __classPrivateFieldSet(this, _Requester_url, 'https://jquestions.herokuapp.com/v0/', "f");
        }
        console.log('Talking to', __classPrivateFieldGet(this, _Requester_url, "f"));
        this.register.bind(this);
        this.list.bind(this);
        this.getQuestion.bind(this);
        __classPrivateFieldGet(this, _Requester_instances, "m", _Requester_getQuestionElements).bind(this);
        this.acceptClaims.bind(this);
    }
    register(username, examPassword) {
        console.log('Preparing register');
        const initial = __classPrivateFieldGet(Requester, _a, "m", _Requester_getFetchInit).call(Requester, 'POST', new Login(username, username));
        initial.headers.set('content-type', 'text/plain');
        initial.headers.set('Accept', 'text/plain');
        const init = Object.assign(Object.assign({}, initial), { body: examPassword });
        const errorHandler = __classPrivateFieldGet(Requester, _a, "m", _Requester_getErrorHandlerExpecting).call(Requester, 200, 'connect');
        return fetch(`${__classPrivateFieldGet(this, _Requester_url, "f")}exam/1/register`, init).then(errorHandler).then(r => r.text());
    }
    list(login) {
        const init = __classPrivateFieldGet(Requester, _a, "m", _Requester_getFetchInit).call(Requester, 'GET', new Login(login.username, login.username));
        init.headers.set('Accept', 'application/json');
        const requestName = 'list';
        const errorHandler = __classPrivateFieldGet(Requester, _a, "m", _Requester_getErrorHandlerExpecting).call(Requester, 200, requestName);
        return fetch(`${__classPrivateFieldGet(this, _Requester_url, "f")}exam/1/list?personal=${login.password}`, init).then(errorHandler).then(r => r.json()).then(asSetOfIntegersOrThrow);
    }
    getQuestion(login, id) {
        let promisePhrasing;
        {
            const init = __classPrivateFieldGet(Requester, _a, "m", _Requester_getFetchInit).call(Requester, 'GET', new Login(login.username, login.username));
            init.headers.set('Accept', 'application/xhtml+xml');
            const errorHandler = __classPrivateFieldGet(Requester, _a, "m", _Requester_getErrorHandlerExpecting).call(Requester, 200, 'phrasing');
            promisePhrasing = fetch(`${__classPrivateFieldGet(this, _Requester_url, "f")}question/phrasing/${id}`, init)
                .then(errorHandler)
                .then(r => r.text())
                .then(t => new DOMParser().parseFromString(t, 'application/xhtml+xml'))
                .then(__classPrivateFieldGet(this, _Requester_instances, "m", _Requester_getQuestionElements));
        }
        let promiseAcceptedClaims;
        {
            const init = __classPrivateFieldGet(Requester, _a, "m", _Requester_getFetchInit).call(Requester, 'GET', new Login(login.username, login.username));
            init.headers.set('Accept', 'application/json');
            const errorHandler = __classPrivateFieldGet(Requester, _a, "m", _Requester_getErrorHandlerExpecting).call(Requester, new Set([200, 204]), 'acceptedClaims');
            promiseAcceptedClaims = fetch(`${__classPrivateFieldGet(this, _Requester_url, "f")}exam/1/answer/${id}`, init)
                .then(errorHandler)
                .then(r => r.status === 200 ? r.json() : []).then(asSetOfIntegersOrThrow);
        }
        const promisesFulfilled = [promisePhrasing, promiseAcceptedClaims];
        return Promise.all(promisesFulfilled).then(ar => ({
            questionElement: ar[0],
            acceptedClaims: ar[1]
        }));
    }
    acceptClaims(login, questionId, acceptedClaimsIds) {
        console.log('Accepting', acceptedClaimsIds);
        const initial = __classPrivateFieldGet(Requester, _a, "m", _Requester_getFetchInit).call(Requester, 'POST', new Login(login.username, login.username));
        initial.headers.set('content-type', 'application/json');
        const init = Object.assign(Object.assign({}, initial), { body: JSON.stringify(Array.from(acceptedClaimsIds)) });
        const errorHandler = __classPrivateFieldGet(Requester, _a, "m", _Requester_getErrorHandlerExpecting).call(Requester, 204, 'acceptClaims');
        return fetch(`${__classPrivateFieldGet(this, _Requester_url, "f")}exam/1/answer/${questionId}`, init).then(errorHandler).then(_r => undefined);
    }
}
_a = Requester, _Requester_url = new WeakMap(), _Requester_instances = new WeakSet(), _Requester_getFetchInit = function _Requester_getFetchInit(method = 'GET', login) {
    let headers = new Headers();
    const init = {
        headers: headers,
        method: method
    };
    if (login !== undefined) {
        const credentials = login.credentials;
        const authString = `Basic ${credentials}`;
        init.headers.set('Authorization', authString);
    }
    return init;
}, _Requester_getErrorHandlerExpecting = function _Requester_getErrorHandlerExpecting(expectedStatus, requestName) {
    return function handle(response) {
        const expectedStatuses = (expectedStatus instanceof Set) ? expectedStatus : new Set().add(expectedStatus);
        if (!expectedStatuses.has(response.status)) {
            throw new Error(`Unexpected response status to ${requestName}: ${response.status}`);
        }
        return response;
    };
}, _Requester_getQuestionElements = function _Requester_getQuestionElements(phrasingDom) {
    const body = phrasingDom.body;
    const children = body.children;
    const sectionChildren = Array.from(children).filter(e => e.tagName === 'section');
    if (sectionChildren.length != 1) {
        throw new Error(`Unexpected sections inside body in ${phrasingDom}`);
    }
    const sectionElement = sectionChildren[0];
    const questionElements = Array.from(sectionElement.children);
    if (questionElements.length === 0) {
        throw new Error('No content');
    }
    return sectionElement;
};
