export class Login {
	#username;
	#password;

	constructor(username, password) {
		if (username == null || password == null)
			throw new Error("Bad login use.");

		this.#username = username;
		this.#password = password;
	}

	/**
	 * Converts a JS string to a UTF-8 "byte" array.
	 * @param {string} str 16-bit unicode string.
	 * @return {!Array<number>} UTF-8 byte array.
	 * From https://github.com/google/closure-library/blob/master/closure/goog/crypt/crypt.js#L114
	 */
	#stringToUtf8ByteArray(str) {
		let out = [], p = 0;
		for (let i = 0; i < str.length; i++) {
			let c = str.charCodeAt(i);
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
	#stringToUtf8ToBase64(input) {
		const utf8 = this.#stringToUtf8ByteArray(input);
		let result = '';
		for (let i = 0; i < utf8.length; i++) {
			result += String.fromCharCode(utf8[i]);
		}
		const encoded = window.btoa(result);
		console.log(`Encoded ${input} to ${encoded}.`);
		return encoded;
	}

	get username() {
		return this.#username;
	}

	get password() {
		return this.#password;
	}

	get credentials() {
		return window.btoa(`${this.#stringToUtf8ToBase64(this.#username)}:${this.#stringToUtf8ToBase64(this.#password)}`);
	}
}

export class LoginController {
	#localStorage;

	constructor() {
		this.#localStorage = window.localStorage;
	}

	readLogin() {
		const username = this.#localStorage.getItem('username');
		const password = this.#localStorage.getItem('password');
		const hasUsername = username != null;
		const hasPassword = password != null;
		if (hasUsername !== hasPassword)
			throw new Error("Bad local login state.");

		if (!hasUsername) {
			return undefined;
		}
		return new Login(username, password);
	}

	write(login) {
		if (login == null) {
			throw new Error('Unknown login, can’t write.');
		}

		this.#localStorage.setItem('username', login.username);
		this.#localStorage.setItem('password', login.password);
	}

	deleteLogin() {
		this.#localStorage.removeItem('username');
		this.#localStorage.removeItem('password');
	}
}

export class LoginGenerator {
	static generateLogin(username = 'current time') {
		const password = 'generated password';
		return new Login(username, password);
	}
}
