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

	static #getFetchInit(method = 'GET', login = undefined) {
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

	static #getErrorHandlerExpecting(expectedStatus, requestName) {
		return function handle(response) {
			console.log('Handling', response);
			if (response.status !== expectedStatus) {
				throw new Error('Unexpected response status to ' + requestName + ': ' + response.status);
			}
			return response;
		};
	}

	connect(username) {
		const init = Requester.#getFetchInit('POST');
		init.headers.set('Accept', 'text/plain');
		init.body = username;
		init.headers.set('content-type', 'text/plain');

		const errorHandler = Requester.#getErrorHandlerExpecting(200, 'connect');
		return fetch(`${this.#url}exam/connect`, init).then(errorHandler).then(r => r.text());
	}

	list(login) {
		if (this.listRequested) {
			console.log('Already an ongoing request for list');
			return;
		}

		const init = Requester.#getFetchInit('GET', login);
		init.headers.set('Accept', 'application/json');

		const p = fetch(`${this.#url}exam/list`, init);
		this.listRequested = true;
		const errorHandler = Requester.#getErrorHandlerExpecting(200, 'list');
		p.then(errorHandler).then(response => { this.listRequested = false; return response; });
		return p;
	}

	getQuestion(login, id) {
		if ((this.lastRequestedAcceptationQuestionId === id) || this.lastRequestedPhrasingId === id) {
			console.log('Already an ongoing request for question', id);
			return;
		}

		const init = Requester.#getFetchInit('GET', login);
		init.headers.set('Accept', 'application/xhtml+xml');
		const promisePhrasing = fetch(`${this.#url}question/phrasing/${id}`, init);
		this.lastRequestedPhrasingId = id;
		promisePhrasing.then(this.lastRequestedPhrasingId = null);

		init.headers.set('Accept', 'application/json');
		const promiseAnswer = fetch(`${this.#url}exam/answer/${id}`, init);
		this.lastRequestedAcceptationQuestionId = id;
		promiseAnswer.then(this.lastRequestedAcceptationQuestionId = null);
		
		return Promise.all(new Set().add(promisePhrasing).add(promiseAnswer)).then(ar => new Object({phrasing: ar[0], answer: ar[1]}));
	}

	answer(login, questionId, checkedIds, onAnswer) {
		const init = Requester.#getFetchInit('POST', login);
		init.body = JSON.stringify(checkedIds);
		init.headers.set('content-type', 'application/json');

		fetch(`${this.#url}exam/answer/${questionId}`, init).then(onAnswer);
	}
}
