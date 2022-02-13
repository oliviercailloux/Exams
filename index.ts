import { Requester } from './modules/requester.js';
import { Login, LoginController } from './modules/login.js';

if (window.location.protocol !== 'https:' && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
	throw new Error('Protocol should be https.');
}

class Controller {
	#loginController: LoginController;
	#login: Login | undefined;
	#requester: Requester;

	#nameElement: HTMLTextAreaElement;
	#startButton: HTMLButtonElement;

	constructor() {
		console.log('Building controller.');

		this.#loginController = new LoginController();
		this.#requester = new Requester();
		
		this.refresh = this.refresh.bind(this);
		
		this.#nameElement = document.getElementById('name') as HTMLTextAreaElement;
		this.#startButton = document.getElementById('start') as HTMLButtonElement;
		this.#startButton.addEventListener('click', this.#start.bind(this));
	}

	refresh() {
		this.#login = this.#loginController.readLogin();

		if (this.#login !== undefined) {
			this.#requester.list(this.#login).then(this.#gotList.bind(this));
		}
	}

	#start(_event: Event) {
		this.#requester.register(this.#nameElement.value, "").then(this.#gotPersonalExamPassword.bind(this));
	}

	#gotPersonalExamPassword(personalExamPassword: string) {
		const login = new Login(this.#nameElement.value, personalExamPassword);
		this.#loginController.write(login);
		this.refresh();
	}

	#gotList(list: number[]) {
		console.log('Got list', list);
		this.#navigate(list[0]);
	}

	#navigate(id: number) {
		const target = `exam.html?${id}`;
		console.log('Navigating to', target);
		window.location.href = target;
	}

	#resetLogin() {
		this.#loginController.deleteLogin();
	}
}

new Controller().refresh();
