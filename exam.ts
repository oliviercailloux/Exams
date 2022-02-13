import { verify, checkDefined, asAnchor } from './modules/utils';
import { Requester } from './modules/requester';
import { Login, LoginController } from './modules/login';

if (window.location.protocol !== 'https:' && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
	throw new Error('Protocol should be https.');
}

class Question {
	#id;
	#elements;
	#checkboxElements;

	constructor(id: number, elements: Iterable<Element>) {
		verify(id >= 0);

		this.#id = id;
		this.#elements = Array.from(elements);

		const inputs = Array.from(document.getElementsByTagName('input'));
		/*		this.#checkboxElements = inputs.filter(i => i.attributes.getNamedItem('type').value === 'checkbox');*/
		this.#checkboxElements = inputs.filter(i => i.type === 'checkbox');
	}

	get id() {
		return this.#id;
	}

	get elements() {
		return this.#elements;
	}

	get checkboxElements() {
		return this.#checkboxElements;
	}

	static #claimIdToInt(claimId: string) {
		if (claimId.substring(0, 6) !== 'claim-') {
			throw new Error(`Unknown claim id: ${claimId}.`);
		}
		const idString = claimId.substring(6);
		const id = parseInt(idString, 10);
		if (Number.isNaN(id)) {
			throw new Error('Non numeric claim id.');
		}
		return id;
	}

	get acceptedClaims() {
		const arrayInts = this.#checkboxElements.filter(c => c.checked).map(c => c.id).map(Question.#claimIdToInt);
		return new Set(arrayInts);
	}

	markAcceptedClaims(acceptedClaims: Set<number>) {
		for (let acceptedIndexOneBased of acceptedClaims) {
			this.#checkboxElements[acceptedIndexOneBased - 1].checked = true;
		}
	}
}

class Exam {
	// Map<id, pos>
	#idsMap: Map<number, number>;

	constructor(idsS: Set<number>) {
		this.#idsMap = new Map();
		let position = 1;
		for (let id of idsS) {
			this.#idsMap.set(id, position);
			++position;
		}

		this.getPositionOf.bind(this);
		this.getPreviousId.bind(this);
		this.getNextId.bind(this);
		this.isFirst.bind(this);
		this.isLast.bind(this);
	}

	get size() {
		return this.#idsMap.size;
	}

	getPositionOf(id: number) {
		const pos = this.#idsMap.get(id);
		if (pos === undefined) {
			throw new Error(`No such id: ${id}.`);
		}
		return pos;
	}

	#getId(position: number) {
		for (let [k, v] of this.#idsMap) {
			if (v === position) {
				return k;
			}
		}
		throw new Error(`Not found ${position}.`);
	}

	getPreviousId(id: number) {
		const pos = this.getPositionOf(id);
		if (!pos) {
			throw new Error(`Unknown id: ${id}, type ${typeof id}, got ${pos}.`);
		}
		if (pos === 1) {
			return undefined;
		}
		return this.#getId(pos - 1);
	}

	getNextId(id: number) {
		const pos = this.getPositionOf(id);
		if (pos === this.size) {
			return undefined;
		}
		return this.#getId(pos + 1);
	}

	isFirst(id: number) {
		return this.getPositionOf(id) === 1;
	}

	isLast(id: number) {
		return this.getPositionOf(id) === this.size;
	}

	get ids() {
		const ids: Set<number> = new Set();
		for (let id of this.#idsMap.keys()) {
			ids.add(id);
		}
		return ids;
	}
}

class QuestionInExam {
	#question;
	#exam;

	constructor(question: Question, ids: Set<number>) {
		this.#question = question;
		this.#exam = new Exam(ids);
	}

	get position() {
		return this.#exam.getPositionOf(this.#question.id);
	}

	get question() {
		return this.#question;
	}

	get previousId() {
		return this.#exam.getPreviousId(this.#question.id);
	}

	get nextId() {
		return this.#exam.getNextId(this.#question.id);
	}

	get isFirst() {
		return this.#exam.isFirst(this.#question.id);
	}

	get isLast() {
		return this.#exam.isLast(this.#question.id);
	}

	markAcceptedClaims(acceptedClaims: Set<number>) {
		this.#question.markAcceptedClaims(acceptedClaims);
	}

	get ids() {
		return this.#exam.ids;
	}
}

class Controller {
	#requester;

	#login;
	#ids: Set<number> | undefined;

	#titleElement;
	#previousAnchor;
	#nextAnchor;
	#endAnchor;
	#contentsDiv;

	constructor() {
		this.#requester = new Requester();

		const login = new LoginController().readLogin();
		if (login === undefined) {
			throw new Error('No login.');
		}
		this.#login = login;
		this.#ids = undefined;

		this.#titleElement = checkDefined(document.getElementById('title'));
		this.#previousAnchor = asAnchor(document.getElementById('previous'));
		this.#nextAnchor = asAnchor(document.getElementById('next'));
		this.#endAnchor = asAnchor(document.getElementById('end'));
		this.#contentsDiv = checkDefined(document.getElementById('contents'));
	}

	static #getIdFromUrl() {
		const requested = window.location.search?.substring(1);
		if (!requested) {
			throw new Error('No id.');
		}
		const id = parseInt(requested, 10);
		if (Number.isNaN(id)) {
			throw new Error('Non numeric id.');
		}
		return id;
	}

	#setTitle(title: string) {
		window.document.title = title;
		this.#titleElement.innerHTML = title;
	}

	/* Reads current id, queries and sets title. */
	refresh() {
		const id = Controller.#getIdFromUrl();

		const overNb = this.#ids === undefined ? '…' : `… / ${this.#ids.size}`;
		this.#setTitle(`Question ${overNb} (loading)`);

		let promiseIds: Promise<Set<number>>;
		if (this.#ids === undefined) {
			promiseIds = this.#requester.list(this.#login);
		} else {
			promiseIds = Promise.resolve(this.#ids);
		}
		const promiseQuestion = this.#requester.getQuestion(this.#login, id);

		Promise.all([promiseIds, promiseQuestion]).then(
			ar => {
				const ids: Set<number> = ar[0];
				if (!ids.has(id)) {
					throw new Error(`Unknown id: ${id}.`);
				}
				const questionElements = ar[1].questionElements;
				const acceptedClaims = ar[1].acceptedClaims;
				const question = new QuestionInExam(new Question(id, questionElements), ids);
				question.markAcceptedClaims(acceptedClaims);
				return this.#processQuestion(question);
			}

		);
	}

	#processQuestion(questionInExam: QuestionInExam) {
		const id = Controller.#getIdFromUrl();

		if (this.#contentsDiv.children.length !== 0) {
			throw new Error('Contents non empty.');
		}

		this.#ids = questionInExam.ids;

		questionInExam.question.checkboxElements.forEach(
			c => c.addEventListener('click',
				_e => this.#requester.acceptClaims(this.#login, id, questionInExam.question.acceptedClaims)
			)
		);

		{
			const targetId = questionInExam.previousId;
			this.#previousAnchor.hidden = questionInExam.isFirst;
			verify(this.#previousAnchor.hidden === (targetId === undefined))
			if (targetId !== undefined) {
				this.#previousAnchor.href = Controller.#getUrlOfId(targetId).toString();
			}
		}
		{
			const targetId = questionInExam.nextId;
			this.#nextAnchor.hidden = questionInExam.isLast;
			verify(this.#nextAnchor.hidden === (targetId === undefined))
			if (targetId !== undefined) {
				this.#nextAnchor.href = Controller.#getUrlOfId(targetId).toString();
			}
		}
		this.#endAnchor.hidden = !questionInExam.isLast;

		this.#setTitle(`Question ${questionInExam.position} / ${questionInExam.ids.size}`);
		questionInExam.question.elements.forEach(e => this.#contentsDiv.appendChild(e));
	}

	static #getUrlOfId(id: number) {
		const newUrl = new URL(window.location.href);
		newUrl.search = `?${id}`;
		return newUrl;
	}

	navigateTo(id: number) {
		this.#contentsDiv.innerHTML = '';

		history.pushState(id, `Question ${id}`, Controller.#getUrlOfId(id));
		this.refresh();
	}
}

new Controller().refresh();
