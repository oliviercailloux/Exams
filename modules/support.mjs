/**
 * Converts a JS string to a UTF-8 "byte" array.
 * @param {string} str 16-bit unicode string.
 * @return {!Array<number>} UTF-8 byte array.
 * From https://github.com/google/closure-library/blob/master/closure/goog/crypt/crypt.js#L114
 */
function stringToUtf8ByteArray(str) {
	let out = [], p = 0;
	for (let i = 0; i < str.length; i++) {
		const c = str.charCodeAt(i);
		if (c < 128) {
			out[p++] = c;
		} else if (c < 2048) {
			out[p++] = (c >> 6) | 192;
			out[p++] = (c & 63) | 128;
		} else if (
			((c & 0xFC00) == 0xD800) && (i + 1) < str.length &&
			((str.charCodeAt(i + 1) & 0xFC00) == 0xDC00)) {
			// Surrogate Pair
			c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
			out[p++] = (c >> 18) | 240;
			out[p++] = ((c >> 12) & 63) | 128;
			out[p++] = ((c >> 6) & 63) | 128;
			out[p++] = (c & 63) | 128;
		} else {
			out[p++] = (c >> 12) | 224;
			out[p++] = ((c >> 6) & 63) | 128;
			out[p++] = (c & 63) | 128;
		}
	}
	return out;
};

/** I convert to UTF-8 because it seems much more prevalent (https://en.wikipedia.org/wiki/Popularity_of_text_encodings). Code taken from https://stackoverflow.com/a/9458996. */
function stringToUtf8ToBase64(input) {
	const utf8 = stringToUtf8ByteArray(input);
	let result = '';
	for (let i = 0; i < utf8.length; i++) {
		result += String.fromCharCode(utf8[i]);
	}
	const encoded = window.btoa(result);
	console.log(`Encoded ${input} to ${encoded}.`);
	return encoded;
}

class Requester {
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

	getFetchInit() {
		let headers = new Headers();
		const init = {
			headers: headers
		};
		headers.set('content-type', 'application/json');
		headers.set('Accept', 'application/json');
		return init;
	}

	getFetchInitWithAuth(login) {
		console.log('Fetching with', login, '.');
		const init = this.getFetchInit();
		const credentials = window.btoa(`${stringToUtf8ToBase64(login.username)}:${stringToUtf8ToBase64(login.password)}`)
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
		const init = this.getFetchInitWithAuth(login);
		init.method = 'GET';
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
		
		const init = this.getFetchInitWithAuth(login);
		init.method = 'GET';
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
		const init = this.getFetchInitWithAuth(login);
		init.method = 'POST';
		init.body = JSON.stringify(checkedIds);
		fetch(`${this.url}exam/answer/${questionId}`, init).then(onAnswer);
	}
}

class Login {
	hasUsername;

	username;
	password;

	constructor(username, password) {
		if (username === null || password === null)
			throw new Error("Bad login use.");

		const uUndef = username === undefined;
		const pUndef = password === undefined;
		if (uUndef !== pUndef)
			throw new Error("Bad login use.");

		if (uUndef) {
			this.init();
		} else {
			this.username = username;
			this.password = password;
			this.hadId = true;
		}
	}

	getAsJsonBody() {
		const body = {
			username: this.username,
			password: this.password
		}
		return JSON.stringify(body);
	}

	init() {
		let l = window.localStorage;

		this.username = l.getItem('username');
		this.password = l.getItem('password');
		this.hasUsername = l.getItem('username') !== null;
		const hasPassword = l.getItem('password') !== null;
		if (this.hasUsername !== hasPassword)
			throw new Error("Bad login state.");

		console.log('Found username', this.username);
	}
}
