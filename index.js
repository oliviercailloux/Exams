import { Requester } from './modules/requester.mjs';
import { Login, LoginController } from './modules/login.mjs';

if (window.location.protocol !== 'https:' && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
	throw new Error('Protocol should be https.');
}

class Controller {
	loginController;
	login;
	requester;

	nameElement;
	startButton;

	constructor() {
		console.log('Building controller.');

		this.loginController = new LoginController();
		this.requester = new Requester();
		
		this.start = this.start.bind(this);
		this.gotPassword = this.gotPassword.bind(this);
		
		this.nameElement = document.getElementById('name');
		this.startButton = document.getElementById('start');
		this.startButton.addEventListener('click', this.start);
	}

	refresh() {
		this.login = this.loginController.readLogin();

		if (this.login !== undefined) {
			this.requester.list(this.login, r => this.listed.call(this, r));
		}
	}

	start(event) {
		this.requester.connect(this.nameElement.value).then(this.gotPassword);
	}

	gotPassword(password) {
		const login = new Login(this.nameElement.value, password);
		this.loginController.write(login);
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
		this.loginController.deleteLogin();
	}
}

new Controller().refresh();
