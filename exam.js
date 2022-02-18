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
var _a, _Question_id, _Question_element, _Question_checkboxElements, _Question_claimIdToInt, _Exam_instances, _Exam_idsMap, _Exam_getId, _QuestionInExam_question, _QuestionInExam_exam, _Controller_instances, _b, _Controller_requester, _Controller_login, _Controller_ids, _Controller_titleElement, _Controller_statusElement, _Controller_previousAnchor, _Controller_nextAnchor, _Controller_endAnchor, _Controller_contentsDiv, _Controller_getIdFromUrl, _Controller_setTitle, _Controller_setStatus, _Controller_acceptClaims, _Controller_processQuestion, _Controller_getUrlOfId;
import { verify, checkDefined, asAnchor } from './modules/utils.js';
import { Requester } from './modules/requester.js';
import { LoginController } from './modules/login.js';
if (window.location.protocol !== 'https:' && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
    throw new Error('Protocol should be https.');
}
class Question {
    constructor(id, element) {
        _Question_id.set(this, void 0);
        _Question_element.set(this, void 0);
        _Question_checkboxElements.set(this, void 0);
        verify(id >= 0);
        __classPrivateFieldSet(this, _Question_id, id, "f");
        __classPrivateFieldSet(this, _Question_element, element, "f");
        const inputs = Array.from(__classPrivateFieldGet(this, _Question_element, "f").getElementsByTagName('input'));
        __classPrivateFieldSet(this, _Question_checkboxElements, inputs.filter(i => i.type === 'checkbox'), "f");
    }
    get id() {
        return __classPrivateFieldGet(this, _Question_id, "f");
    }
    get element() {
        return __classPrivateFieldGet(this, _Question_element, "f");
    }
    get checkboxElements() {
        return __classPrivateFieldGet(this, _Question_checkboxElements, "f");
    }
    get acceptedClaims() {
        const arrayInts = __classPrivateFieldGet(this, _Question_checkboxElements, "f").filter(c => c.checked).map(c => c.id).map(__classPrivateFieldGet(Question, _a, "m", _Question_claimIdToInt));
        return new Set(arrayInts);
    }
    markAcceptedClaims(acceptedClaims) {
        for (let acceptedIndexOneBased of acceptedClaims) {
            __classPrivateFieldGet(this, _Question_checkboxElements, "f")[acceptedIndexOneBased - 1].checked = true;
        }
    }
}
_a = Question, _Question_id = new WeakMap(), _Question_element = new WeakMap(), _Question_checkboxElements = new WeakMap(), _Question_claimIdToInt = function _Question_claimIdToInt(claimId) {
    if (claimId.substring(0, 6) !== 'claim-') {
        throw new Error(`Unknown claim id: ${claimId}.`);
    }
    const idString = claimId.substring(6);
    const id = parseInt(idString, 10);
    if (Number.isNaN(id)) {
        throw new Error('Non numeric claim id.');
    }
    return id;
};
class Exam {
    constructor(idsS) {
        _Exam_instances.add(this);
        // Map<id, pos>
        _Exam_idsMap.set(this, void 0);
        __classPrivateFieldSet(this, _Exam_idsMap, new Map(), "f");
        let position = 1;
        for (let id of idsS) {
            __classPrivateFieldGet(this, _Exam_idsMap, "f").set(id, position);
            ++position;
        }
        this.getPositionOf.bind(this);
        this.getPreviousId.bind(this);
        this.getNextId.bind(this);
        this.isFirst.bind(this);
        this.isLast.bind(this);
    }
    get size() {
        return __classPrivateFieldGet(this, _Exam_idsMap, "f").size;
    }
    getPositionOf(id) {
        const pos = __classPrivateFieldGet(this, _Exam_idsMap, "f").get(id);
        if (pos === undefined) {
            throw new Error(`No such id: ${id}.`);
        }
        return pos;
    }
    getPreviousId(id) {
        const pos = this.getPositionOf(id);
        if (!pos) {
            throw new Error(`Unknown id: ${id}, type ${typeof id}, got ${pos}.`);
        }
        if (pos === 1) {
            return undefined;
        }
        return __classPrivateFieldGet(this, _Exam_instances, "m", _Exam_getId).call(this, pos - 1);
    }
    getNextId(id) {
        const pos = this.getPositionOf(id);
        if (pos === this.size) {
            return undefined;
        }
        return __classPrivateFieldGet(this, _Exam_instances, "m", _Exam_getId).call(this, pos + 1);
    }
    isFirst(id) {
        return this.getPositionOf(id) === 1;
    }
    isLast(id) {
        return this.getPositionOf(id) === this.size;
    }
    get ids() {
        const ids = new Set();
        for (let id of __classPrivateFieldGet(this, _Exam_idsMap, "f").keys()) {
            ids.add(id);
        }
        return ids;
    }
}
_Exam_idsMap = new WeakMap(), _Exam_instances = new WeakSet(), _Exam_getId = function _Exam_getId(position) {
    for (let [k, v] of __classPrivateFieldGet(this, _Exam_idsMap, "f")) {
        if (v === position) {
            return k;
        }
    }
    throw new Error(`Not found ${position}.`);
};
class QuestionInExam {
    constructor(question, ids) {
        _QuestionInExam_question.set(this, void 0);
        _QuestionInExam_exam.set(this, void 0);
        __classPrivateFieldSet(this, _QuestionInExam_question, question, "f");
        __classPrivateFieldSet(this, _QuestionInExam_exam, new Exam(ids), "f");
    }
    get position() {
        return __classPrivateFieldGet(this, _QuestionInExam_exam, "f").getPositionOf(__classPrivateFieldGet(this, _QuestionInExam_question, "f").id);
    }
    get question() {
        return __classPrivateFieldGet(this, _QuestionInExam_question, "f");
    }
    get previousId() {
        return __classPrivateFieldGet(this, _QuestionInExam_exam, "f").getPreviousId(__classPrivateFieldGet(this, _QuestionInExam_question, "f").id);
    }
    get nextId() {
        return __classPrivateFieldGet(this, _QuestionInExam_exam, "f").getNextId(__classPrivateFieldGet(this, _QuestionInExam_question, "f").id);
    }
    get isFirst() {
        return __classPrivateFieldGet(this, _QuestionInExam_exam, "f").isFirst(__classPrivateFieldGet(this, _QuestionInExam_question, "f").id);
    }
    get isLast() {
        return __classPrivateFieldGet(this, _QuestionInExam_exam, "f").isLast(__classPrivateFieldGet(this, _QuestionInExam_question, "f").id);
    }
    markAcceptedClaims(acceptedClaims) {
        __classPrivateFieldGet(this, _QuestionInExam_question, "f").markAcceptedClaims(acceptedClaims);
    }
    get ids() {
        return __classPrivateFieldGet(this, _QuestionInExam_exam, "f").ids;
    }
}
_QuestionInExam_question = new WeakMap(), _QuestionInExam_exam = new WeakMap();
class Controller {
    constructor() {
        _Controller_instances.add(this);
        _Controller_requester.set(this, void 0);
        _Controller_login.set(this, void 0);
        _Controller_ids.set(this, void 0);
        _Controller_titleElement.set(this, void 0);
        _Controller_statusElement.set(this, void 0);
        _Controller_previousAnchor.set(this, void 0);
        _Controller_nextAnchor.set(this, void 0);
        _Controller_endAnchor.set(this, void 0);
        _Controller_contentsDiv.set(this, void 0);
        __classPrivateFieldSet(this, _Controller_requester, new Requester(), "f");
        const login = new LoginController().readLogin();
        if (login === undefined) {
            throw new Error('No login.');
        }
        __classPrivateFieldSet(this, _Controller_login, login, "f");
        __classPrivateFieldSet(this, _Controller_ids, undefined, "f");
        __classPrivateFieldSet(this, _Controller_titleElement, checkDefined(document.getElementById('title')), "f");
        __classPrivateFieldSet(this, _Controller_statusElement, checkDefined(document.getElementById('status')), "f");
        __classPrivateFieldSet(this, _Controller_previousAnchor, asAnchor(document.getElementById('previous')), "f");
        __classPrivateFieldSet(this, _Controller_nextAnchor, asAnchor(document.getElementById('next')), "f");
        __classPrivateFieldSet(this, _Controller_endAnchor, asAnchor(document.getElementById('end')), "f");
        __classPrivateFieldSet(this, _Controller_contentsDiv, checkDefined(document.getElementById('contents')), "f");
    }
    /* Reads current id, queries and sets title. */
    refresh() {
        const id = __classPrivateFieldGet(Controller, _b, "m", _Controller_getIdFromUrl).call(Controller);
        const overNb = __classPrivateFieldGet(this, _Controller_ids, "f") === undefined ? '…' : `… / ${__classPrivateFieldGet(this, _Controller_ids, "f").size}`;
        __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_setTitle).call(this, `Question ${overNb}`, 'loading');
        let promiseIds;
        if (__classPrivateFieldGet(this, _Controller_ids, "f") === undefined) {
            promiseIds = __classPrivateFieldGet(this, _Controller_requester, "f").list(__classPrivateFieldGet(this, _Controller_login, "f"))
                .then(ids => {
                if (ids === undefined)
                    throw new Error('List failed');
                return ids;
            });
        }
        else {
            promiseIds = Promise.resolve(__classPrivateFieldGet(this, _Controller_ids, "f"));
        }
        const promiseQuestion = __classPrivateFieldGet(this, _Controller_requester, "f").getQuestion(__classPrivateFieldGet(this, _Controller_login, "f"), id);
        Promise.all([promiseIds, promiseQuestion]).then(ar => {
            const ids = ar[0];
            if (!ids.has(id)) {
                throw new Error(`Unknown id: ${id}.`);
            }
            const questionElement = ar[1].questionElement;
            const acceptedClaims = ar[1].acceptedClaims;
            const question = new QuestionInExam(new Question(id, questionElement), ids);
            question.markAcceptedClaims(acceptedClaims);
            return __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_processQuestion).call(this, question);
        });
    }
    navigateTo(id) {
        __classPrivateFieldGet(this, _Controller_contentsDiv, "f").innerHTML = '';
        history.pushState(id, `Question ${id}`, __classPrivateFieldGet(Controller, _b, "m", _Controller_getUrlOfId).call(Controller, id));
        this.refresh();
    }
}
_b = Controller, _Controller_requester = new WeakMap(), _Controller_login = new WeakMap(), _Controller_ids = new WeakMap(), _Controller_titleElement = new WeakMap(), _Controller_statusElement = new WeakMap(), _Controller_previousAnchor = new WeakMap(), _Controller_nextAnchor = new WeakMap(), _Controller_endAnchor = new WeakMap(), _Controller_contentsDiv = new WeakMap(), _Controller_instances = new WeakSet(), _Controller_getIdFromUrl = function _Controller_getIdFromUrl() {
    var _c;
    const requested = (_c = window.location.search) === null || _c === void 0 ? void 0 : _c.substring(1);
    if (!requested) {
        throw new Error('No id.');
    }
    const id = parseInt(requested, 10);
    if (Number.isNaN(id)) {
        throw new Error('Non numeric id.');
    }
    return id;
}, _Controller_setTitle = function _Controller_setTitle(title, status) {
    const statusString = (status === undefined) ? '' : `(${status})`;
    const fullTitle = `${title} ${statusString}`;
    window.document.title = fullTitle;
    __classPrivateFieldGet(this, _Controller_titleElement, "f").innerHTML = title;
    __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_setStatus).call(this, status);
}, _Controller_setStatus = function _Controller_setStatus(status) {
    const statusString = (status === undefined) ? '' : `(${status})`;
    __classPrivateFieldGet(this, _Controller_statusElement, "f").textContent = `${statusString}`;
}, _Controller_acceptClaims = function _Controller_acceptClaims(q) {
    q.question.checkboxElements.forEach(e => e.disabled = true);
    __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_setStatus).call(this, '*');
    __classPrivateFieldGet(this, _Controller_requester, "f").acceptClaims(__classPrivateFieldGet(this, _Controller_login, "f"), __classPrivateFieldGet(Controller, _b, "m", _Controller_getIdFromUrl).call(Controller), q.question.acceptedClaims)
        .then(() => {
        q.question.checkboxElements.forEach(e => e.disabled = false);
        __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_setStatus).call(this, undefined);
    });
}, _Controller_processQuestion = function _Controller_processQuestion(q) {
    if (__classPrivateFieldGet(this, _Controller_contentsDiv, "f").children.length !== 0) {
        throw new Error('Contents non empty.');
    }
    __classPrivateFieldSet(this, _Controller_ids, q.ids, "f");
    console.log('Listening about', q.question.checkboxElements);
    q.question.checkboxElements.forEach(c => c.addEventListener('click', _e => __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_acceptClaims).bind(this)(q)));
    {
        const targetId = q.previousId;
        __classPrivateFieldGet(this, _Controller_previousAnchor, "f").hidden = q.isFirst;
        verify(__classPrivateFieldGet(this, _Controller_previousAnchor, "f").hidden === (targetId === undefined));
        if (targetId !== undefined) {
            __classPrivateFieldGet(this, _Controller_previousAnchor, "f").href = __classPrivateFieldGet(Controller, _b, "m", _Controller_getUrlOfId).call(Controller, targetId).toString();
        }
    }
    {
        const targetId = q.nextId;
        __classPrivateFieldGet(this, _Controller_nextAnchor, "f").hidden = q.isLast;
        verify(__classPrivateFieldGet(this, _Controller_nextAnchor, "f").hidden === (targetId === undefined));
        if (targetId !== undefined) {
            __classPrivateFieldGet(this, _Controller_nextAnchor, "f").href = __classPrivateFieldGet(Controller, _b, "m", _Controller_getUrlOfId).call(Controller, targetId).toString();
        }
    }
    //		this.#endAnchor.hidden = !q.isLast;
    __classPrivateFieldGet(this, _Controller_instances, "m", _Controller_setTitle).call(this, `Question ${q.position} / ${q.ids.size}`);
    Array.from(q.question.element.children).forEach(e => __classPrivateFieldGet(this, _Controller_contentsDiv, "f").appendChild(e));
}, _Controller_getUrlOfId = function _Controller_getUrlOfId(id) {
    const newUrl = new URL(window.location.href);
    newUrl.search = `?${id}`;
    return newUrl;
};
new Controller().refresh();
