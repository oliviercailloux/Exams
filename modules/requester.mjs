import { Login } from './login.mjs';

export class Requester {
	#url;
	listRequested;
	lastRequestedPhrasingId;
	lastRequestedAcceptationQuestionId;

	constructor() {
		/* Thanks to https://stackoverflow.com/a/57949518/. */
		const isLocalhost =
			window.location.hostname === 'localhost' ||
			// [::1] is the IPv6 localhost address.
			window.location.hostname === '[::1]' ||
			// 127.0.0.1/8 is considered localhost for IPv4.
			window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
			;
		if (isLocalhost) {
			this.#url = `http://${window.location.hostname}:8080/v0/`;
		} else {
			this.#url = 'https://todo.herokuapp.com/v0/';
		}
		console.log('Talking to', this.#url);

		this.listRequested = false;
		this.lastRequestedPhrasingId = null;
		this.lastRequestedAcceptationQuestionId = null;
	}

	#getFetchInit(method = 'GET', login = undefined) {
		let headers = new Headers();
		const init = {
			headers: headers,
			method: method,
			body: undefined
		};

		if (login !== undefined) {
			const credentials = login.credentials;
			const authString = `Basic ${credentials}`;
			init.headers.set('Authorization', authString);
		}

		return init;
	}

	connect(username, onAnswer) {
		const init = this.#getFetchInit('POST');
		init.headers.set('Accept', 'text/plain');
		init.body = username;
		init.headers.set('content-type', 'text/plain');

		fetch(`${this.#url}exam/connect`, init).then(onAnswer);
	}

	list(login, onAnswer) {
		if (this.listRequested) {
			console.log('Already an ongoing request for list');
			return;
		}

		console.log('Listing.');
		const init = this.#getFetchInit('GET', login);
		init.headers.set('Accept', 'application/json');
		
		const p = fetch(`${this.#url}exam/list`, init);
		this.listRequested = true;
		p.then(response => { this.listRequested = false; });
		p.then(onAnswer);
	}

	getQuestion(login, id, onPhrasingAnswer, onAdoptedAnswer) {
		if ((this.lastRequestedAcceptationQuestionId === id) || this.lastRequestedPhrasingId === id) {
			console.log('Already an ongoing request for question', id);
			return;
		}
		this.lastRequestedPhrasingId = id;
		this.lastRequestedAcceptationQuestionId = id;

		const init = this.#getFetchInit('GET', login);
		init.headers.set('Accept', 'application/xhtml+xml');
		const promisePhrasing = fetch(`${this.#url}question/phrasing/${id}`, init);
		promisePhrasing.then(this.lastRequestedPhrasingId = null);
		promisePhrasing.then(onPhrasingAnswer);

		init.headers.set('Accept', 'application/json');
		const promiseAnswer = fetch(`${this.#url}exam/answer/${id}`, init);
		promiseAnswer.then(this.lastRequestedAcceptationQuestionId = null);
		promiseAnswer.then(onAdoptedAnswer);
	}

	answer(login, questionId, checkedIds, onAnswer) {
		const init = this.#getFetchInit('POST', login);
		init.body = JSON.stringify(checkedIds);
		init.headers.set('content-type', 'application/json');
		
		fetch(`${this.#url}exam/answer/${questionId}`, init).then(onAnswer);
	}
}
