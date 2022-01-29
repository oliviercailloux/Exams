import verify from './modules/utils.mjs';
import Requester from './modules/requester.mjs';
import { Login, LoginController } from './modules/login.mjs';

if (window.location.protocol !== 'https:' && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
	throw new Error('Protocol should be https.');
}

class Question {
	#id;
	#elements;
	#checkboxElements;

	constructor(id, elements) {
		verify(id >= 0);

		this.#id = id;
		this.#elements = elements;

		const inputs = Array.from(document.getElementsByTagName('input'));
		this.#checkboxElements = inputs.filter(i => i.attributes.getNamedItem('type').value === 'checkbox');
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

	get acceptedClaims() {
		const arrayInts = this.#checkboxElements.filter(c => c.checked).map(c => c.id).map(this.#claimIdToInt);
		return new Set(arrayInts);
	}

	markAcceptedClaims(acceptedClaims) {
		for (let acceptedIndexOneBased of acceptedClaims) {
			this.#checkboxElements[acceptedIndexOneBased - 1].checked = true;
		}
	}
}

class Exam {
	// Map<id, pos>
	#ids;

	constructor(ids) {
		this.#ids = new Map();
		let position = 1;
		for (let id of ids) {
			this.#ids.set(id, position);
			++position;
		}

		this.getPositionOf.bind(this);
		this.getPreviousId.bind(this);
		this.getNextId.bind(this);
		this.isFirst.bind(this);
		this.isLast.bind(this);
	}

	get size() {
		return this.#ids.size();
	}

	getPositionOf(id) {
		return this.#ids[id];
	}

	#getId(position) {
		for (let [k, v] of this.#ids) {
			if (v === position) {
				return k;
			}
		}
		throw new Error('Not found ' + position);
	}

	getPreviousId(id) {
		const pos = this.getPositionOf(id);
		if (pos === 1) {
			return undefined;
		}
		return this.#getId(pos - 1);
	}

	getNextId(id) {
		const pos = this.getPositionOf(id);
		if (pos === this.size) {
			return undefined;
		}
		return this.#getId(pos + 1);
	}

	isFirst(id) {
		return this.getPositionOf(id) === 1;
	}

	isLast(id) {
		return this.getPositionOf(id) === this.size;
	}
}

class QuestionInExam {
	#question;
	#exam;

	constructor(question, ids) {
		this.#question = question;
		this.#exam = new Exam(ids);
	}

	get position() {
		return this.#exam.getPositionOf(this.id);
	}

	get id() {
		return this.#question.id;
	}

	get previousId() {
		return this.#exam.getPreviousId(this.id);
	}

	get nextId() {
		return this.#exam.getNextId(this.id);
	}

	get isFirst() {
		return this.#exam.isFirst(this.id);
	}

	get isLast() {
		return this.#exam.isLast(this.id);
	}

	markAcceptedClaims(acceptedClaims) {
		this.#question.markAcceptedClaims(acceptedClaims);
	}
}

class Controller {
	#requester;

	#login;
	#questionInExam;
	
	#previousAnchor;
	#nextAnchor;
	#endAnchor;
	#contentsDiv;

	constructor() {
		this.#requester = new Requester();

		this.#login = new LoginController().readLogin();
		if (this.#login === undefined) {
			throw new Error('No login.');
		}
		this.#questionInExam = undefined;

		this.#previousAnchor = document.getElementById('previous');
		this.#nextAnchor = document.getElementById('next');
		this.#endAnchor = document.getElementById('end');
		this.#contentsDiv = document.getElementById('contents');
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

	/* Reads current id, queries and sets title. */
	refresh() {
		const id = Controller.#getIdFromUrl();

		window.document.title = `Question ${id}…`;

		const promises = new Set();
		if (this.#ids === undefined) {
			const promiseIds = this.#requester.list(this.#login);
			promises.add(promiseIds);
		} else {
			promises.add(Promise.resolve(this.#ids));
		}
		const promiseQuestion = this.#requester.getQuestion(this.#login, id);
		promises.add(promiseQuestion);
		Promise.all(promises).then(
			ar => {
				const ids = ar[0];
				if (!ids.includes(id)) {
					throw new Error('Unknown id', id);
				}
				const questionElements = ar[1].questionElements;
				const acceptedClaims = ar[1].acceptedClaims;
				const question = new QuestionInExam(new Question(id, questionElements), ids);
				question.markAcceptedClaims(acceptedClaims);
				return this.#processQuestion(question);
			}

		);
	}

	#processQuestion(question) {
		if (this.#contentsDiv.children.length !== 0) {
			throw new Error('Contents non empty.');
		}
		
		this.#questionInExam = question;

		question.checkboxElements.forEach(
			c => c.addEventListener('click',
				_e => this.requester.answer(this.#login, id, question.acceptedClaims)
			)
		);

		this.#previousAnchor.href = Controller.#getUrlOfId(question.previousId || '');
		this.#nextAnchor.href = Controller.#getUrlOfId(question.nextId || '');
		this.#previousAnchor.hidden = question.isFirst;
		this.#nextAnchor.hidden = question.isLast;
		this.#endAnchor.hidden = !question.isLast;

		question.questionElements.forEach(this.#contentsDiv.appendChild);
	}
	
	static #getUrlOfId(id) {
		const newUrl = new URL(window.location.href);
		newUrl.search = `?${id}`;
		return newUrl;
	}
		
	navigateTo(id) {
		if (!id) {
			throw new Error('No id.');
		}

		this.#contentsDiv.innerHTML = '';
		this.#questionInExam = undefined;
		
		history.pushState(id, id, Controller.#getUrlOfId(id));
		this.refresh();
	}

	static #claimIdToInt(claimId) {
		if (claimId.substring(0, 6) !== 'claim-') {
			throw new Error('Unknown claim id', claimId);
		}
		const idString = claimId.substring(6);
		const id = parseInt(idString, 10);
		if (Number.isNaN(id)) {
			throw new Error('Non numeric claim id.');
		}
		return id;
	}
}

new Controller().refresh();
