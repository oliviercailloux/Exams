export class Requester {
	url;
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
			this.url = 'http://localhost:8080/v0/';
		} else {
			this.url = 'https://todo.herokuapp.com/v0/';
		}
		console.log('Talking to', this.url);

		this.listRequested = false;
		this.lastRequestedPhrasingId = null;
		this.lastRequestedAcceptationQuestionId = null;
	}

	getFetchInit(method, body = undefined) {
		let headers = new Headers();
		const init = {
			headers: headers,
			method: method,
			body: body
		};
		headers.set('content-type', 'application/json');
		headers.set('Accept', 'application/json');
		return init;
	}

	getFetchInitWithAuth(login, method, body = undefined) {
		console.log('Fetching with', login, '.');
		const init = this.getFetchInit(method, body);
		const credentials = login.credentials;
		const authString = `Basic ${credentials}`;
		init.headers.set('Authorization', authString);
		console.log(`Appended ${authString}.`);
		return init;
	}

	connect(username, onAnswer) {
		let headers = new Headers();
		const init = {
			headers: headers,
			method: 'POST',
			body: username
		};
		headers.set('content-type', 'text/plain');
		headers.set('Accept', 'text/plain');

		console.log('Connecting', init);
		fetch(`${this.url}exam/connect`, init).then(onAnswer);
	}

	list(login, onAnswer) {
		if(this.listRequested) {
			console.log('Already an ongoing request for list');
			return;
		}
		
		console.log('Listing.');
		const init = this.getFetchInitWithAuth(login, 'GET');
		this.listRequested = true;
		const p = fetch(`${this.url}exam/list`, init);
		p.then(response => { this.listRequested = false; });
		p.then(onAnswer);
	}

	getQuestion(login, id, onPhrasingAnswer, onAdoptedAnswer) {
		if((this.lastRequestedAcceptationQuestionId === id) || this.lastRequestedPhrasingId === id) {
			console.log('Already an ongoing request for question', id);
			return;
		}
		this.lastRequestedPhrasingId = id;
		this.lastRequestedAcceptationQuestionId = id;
		
		const init = this.getFetchInitWithAuth(login, 'GET');
		init.headers.set('Accept', 'application/xhtml+xml');
		const promisePhrasing = fetch(`${this.url}question/phrasing/${id}`, init);
		promisePhrasing.then(this.lastRequestedPhrasingId = null);
		promisePhrasing.then(onPhrasingAnswer);
		
		init.headers.set('Accept', 'application/json');
		const promiseAnswer = fetch(`${this.url}exam/answer/${id}`, init);
		promiseAnswer.then(this.lastRequestedAcceptationQuestionId = null);
		promiseAnswer.then(onAdoptedAnswer);
	}

	answer(login, questionId, checkedIds, onAnswer) {
		const init = this.getFetchInitWithAuth(login, 'POST', JSON.stringify(checkedIds));
		fetch(`${this.url}exam/answer/${questionId}`, init).then(onAnswer);
	}
}
