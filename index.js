import { Requester } from './modules/support.mjs';
import { Login, LoginController } from './modules/login.mjs';

if (window.location.protocol !== 'https:' && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
	throw new Error('Protocol should be https.');
}

class Controller {
	login;
	requester;

	nameElement;
	startButton;

	constructor() {
		console.log('Building controller.');

		this.requester = new Requester();

		this.nameElement = document.getElementById('name');
		this.startButton = document.getElementById('start');
		this.startButton.addEventListener('click', e => this.start.call(this, e));
	}

	refresh() {
		this.login = LoginController.readLogin();

		if (this.login !== undefined) {
			this.requester.list(this.login, r => this.listed.call(this, r));
		}
	}

	start(event) {
		console.log('Start.', this);
		this.requester.connect(this.nameElement.value, r => this.connected.call(this, r));
	}

	connected(response) {
		console.log('Connected.', response);
		response.text().then(p => this.gotPassword.call(this, p));
	}

	gotPassword(password) {
		const login = new Login(this.nameElement.value, password);
		LoginController.write(login);
		this.refresh();
	}

	listed(response) {
		console.log('Listed.', response);
		response.json().then(l => this.gotList.call(this, l));
	}

	gotList(list) {
		console.log('Got list', list);
		this.navigate(list[0]);
	}

	navigate(id) {
		const target = `exam.html#${id}`;
		console.log('Navigating to', target);
		window.location.href = target;
	}

	resetLogin() {
		LoginController.deleteLogin();
	}
}

new Controller().refresh();
