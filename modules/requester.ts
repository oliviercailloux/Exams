import { verify, checkDefined, asArrayOrThrow, asArrayOfIntegersOrThrow, asSetOfIntegersOrThrow } from './utils.js';
import { Login } from './login.js';

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
			this.#url = 'https://jquestions.herokuapp.com/v0/';
		}
		console.log('Talking to', this.#url);

		this.register.bind(this);
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

	register(username: string, examPassword: string) {
		console.log('Preparing register');
		const initial = Requester.#getFetchInit('POST', new Login(username, username));
		initial.headers.set('content-type', 'text/plain');
		initial.headers.set('Accept', 'text/plain');
		const init: PostInit = {
			...initial,
			body: examPassword
		}
		const errorHandler = Requester.#getErrorHandlerExpecting(200, 'connect');
		return fetch(`${this.#url}exam/1/register`, init).then(errorHandler)
			.then(r => r.text());
	}

	list(login: Login) {
		const init = Requester.#getFetchInit('GET', new Login(login.username, login.username));
		init.headers.set('Accept', 'application/json');

		const requestName = 'list';
		const errorHandler = Requester.#getErrorHandlerExpecting(new Set([200, 404]), requestName);
		return fetch(`${this.#url}exam/1/list?personal=${login.password}`, init).then(errorHandler)
			.then(r => r.status === 404 ? undefined : r.json())
			.then(j => j === undefined ? undefined : asSetOfIntegersOrThrow(j));
	}

	getQuestion(login: Login, id: number): Promise<{ questionElement: HTMLElement, acceptedClaims: Set<number> }> {
		let promisePhrasing;
		{
			const init = Requester.#getFetchInit('GET', new Login(login.username, login.username));
			init.headers.set('Accept', 'application/xhtml+xml');
			const errorHandler = Requester.#getErrorHandlerExpecting(200, 'phrasing');
			promisePhrasing = fetch(`${this.#url}question/phrasing/${id}`, init)
				.then(errorHandler)
				.then(r => r.text())
				.then(t => new DOMParser().parseFromString(t, 'application/xhtml+xml'))
				.then(this.#getQuestionElements);
		}

		let promiseAcceptedClaims;
		{
			const init = Requester.#getFetchInit('GET', new Login(login.username, login.username));
			init.headers.set('Accept', 'application/json');
			const errorHandler = Requester.#getErrorHandlerExpecting(new Set([200, 204]), 'acceptedClaims');
			promiseAcceptedClaims = fetch(`${this.#url}exam/1/answer/${id}`, init)
				.then(errorHandler)
				.then(r => r.status === 200 ? r.json() : []).then(asSetOfIntegersOrThrow);
		}

		const promisesFulfilled: [Promise<HTMLElement>, Promise<Set<number>>] = [promisePhrasing, promiseAcceptedClaims];

		return Promise.all(promisesFulfilled).then(ar => ({
			questionElement: ar[0],
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
		const sectionElement = sectionChildren[0] as HTMLElement;
		const questionElements = Array.from(sectionElement.children);
		if (questionElements.length === 0) {
			throw new Error('No content');
		}
		return sectionElement;
	}

	acceptClaims(login: Login, questionId: number, acceptedClaimsIds: Set<number>): Promise<void> {
		console.log('Accepting', acceptedClaimsIds);
		const initial = Requester.#getFetchInit('POST', new Login(login.username, login.username));
		initial.headers.set('content-type', 'application/json');
		const init: PostInit = {
			...initial,
			body: JSON.stringify(Array.from(acceptedClaimsIds))
		}

		const errorHandler = Requester.#getErrorHandlerExpecting(204, 'acceptClaims');
		return fetch(`${this.#url}exam/1/answer/${questionId}`, init).then(errorHandler).then(_r => undefined);
	}
}
