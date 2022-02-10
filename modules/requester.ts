import { Login } from './login';

interface PostInit {
	headers: Headers,
	method: 'GET' | 'POST' | 'PUT',
	body: string
}

export class Requester {
	#url;

	constructor() {
		/* Thanks to https://stackoverflow.com/a/57949518/. */
		const isLocalhost =
			window.location.hostname === 'localhost' ||
			// [::1] is the IPv6 localhost address.
			window.location.hostname === '[::1]' ||
			// 127.0.0.1/8 is considered localhost for IPv4.
			(window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/) !== null)
			;
		if (isLocalhost) {
			this.#url = `http://${window.location.hostname}:8080/v0/`;
		} else {
			this.#url = 'https://todo.herokuapp.com/v0/';
		}
		console.log('Talking to', this.#url);

		this.connect.bind(this);
		this.list.bind(this);
		this.getQuestion.bind(this);
		this.#getQuestionElements.bind(this);
		this.acceptClaims.bind(this);
	}

	static #getFetchInit(method: 'GET' | 'POST' | 'PUT' = 'GET', login?: Login) {
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
	}

	static #getErrorHandlerExpecting(expectedStatus: Set<number> | number, requestName: string) {
		return function handle(response: Response) {
			const expectedStatuses = (expectedStatus instanceof Set) ? expectedStatus : new Set().add(expectedStatus);
			if (!expectedStatuses.has(response.status)) {
				throw new Error(`Unexpected response status to ${requestName}: ${response.status}`);
			}
			return response;
		};
	}

	connect(username: string) {
		const initial = Requester.#getFetchInit('POST');
		initial.headers.set('Accept', 'text/plain');
		initial.headers.set('content-type', 'text/plain');
		const init: PostInit = {
			...initial,
			body: username
		}
		const errorHandler = Requester.#getErrorHandlerExpecting(200, 'connect');
		return fetch(`${this.#url}exam/connect`, init).then(errorHandler).then(r => r.text());
	}

	list(login: Login) {
		const init = Requester.#getFetchInit('GET', login);
		init.headers.set('Accept', 'application/json');

		const errorHandler = Requester.#getErrorHandlerExpecting(200, 'list');
		return fetch(`${this.#url}exam/list`, init).then(errorHandler).then(r => r.json());
	}

	getQuestion(login: Login, id: number) {
		const promises = new Set();
		{
			const init = Requester.#getFetchInit('GET', login);
			init.headers.set('Accept', 'application/xhtml+xml');
			const errorHandler = Requester.#getErrorHandlerExpecting(200, 'phrasing');
			const promisePhrasing = fetch(`${this.#url}question/phrasing/${id}`, init)
				.then(errorHandler)
				.then(r => r.text())
				.then(t => new DOMParser().parseFromString(t, 'application/xhtml+xml'))
				.then(this.#getQuestionElements);
			promises.add(promisePhrasing);
		}

		{
			const init = Requester.#getFetchInit('GET', login);
			init.headers.set('Accept', 'application/json');
			const errorHandler = Requester.#getErrorHandlerExpecting(new Set([200, 204]), 'acceptedClaims');
			const promiseAcceptedClaims = fetch(`${this.#url}exam/answer/${id}`, init)
				.then(errorHandler)
				.then(r => r.status === 200 ? r.json() : []);
			promises.add(promiseAcceptedClaims);
		}

		return Promise.all(promises).then(ar => new Object({
			questionElements: ar[0],
			acceptedClaims: ar[1]
		}));
	}

	#getQuestionElements(phrasingDom: Document) {
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
		return questionElements;
	}

	acceptClaims(login: Login, questionId: number, acceptedClaimsIds: Set<number>) {
		const initial = Requester.#getFetchInit('POST', login);
		initial.headers.set('Accept', 'text/plain');
		initial.headers.set('content-type', 'text/plain');
		initial.headers.set('content-type', 'application/json');
		const init: PostInit = {
			...initial,
			body: JSON.stringify(acceptedClaimsIds)
		}

		const errorHandler = Requester.#getErrorHandlerExpecting(204, 'acceptClaims');
		return fetch(`${this.#url}exam/answer/${questionId}`, init).then(errorHandler);
	}
}
