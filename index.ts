import { Requester } from './modules/requester.js';
import { Login, LoginController } from './modules/login.js';
import { asInput, asButton, asElement } from './modules/utils.js';

if (window.location.protocol !== 'https:' && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
	throw new Error('Protocol should be https.');
}

class Controller {
	#loginController: LoginController;
	#login: Login | undefined;
	#requester: Requester;
	#errors: string[];

	#nameElement: HTMLInputElement;
	#examPasswordElement: HTMLInputElement;
	#startButton: HTMLButtonElement;
	#errorsElement: HTMLElement;
	
	constructor() {
		console.log('Building controller.');

		this.#loginController = new LoginController();
		this.#requester = new Requester();
		this.#errors = new Array();
		
		this.refresh = this.refresh.bind(this);

		this.#nameElement = asInput(document.getElementById('name'));
		this.#examPasswordElement = asInput(document.getElementById('exam-password'));
		this.#startButton = asButton(document.getElementById('start'));
		this.#startButton.addEventListener('click', this.#start.bind(this));
		this.#errorsElement = asElement(document.getElementById('errors'));
	}

	refresh() {
		this.#login = this.#loginController.readLogin();

		if (this.#login !== undefined) {
			this.#requester.list(this.#login).then(l => l === undefined ? this.#listNotFound() : this.#gotList(l));
		}
	}
	
	#listNotFound() {
		console.log('List not found, deleting login.');
		this.#loginController.deleteLogin();
		this.refresh();
	}
	
	#start(_event: Event) {
		this.#startButton.disabled = true;
		this.#requester.register(this.#nameElement.value, this.#examPasswordElement.value)
			.then(pw => this.#gotPersonalExamPassword(pw)).catch(e => this.#error.bind(this)(`Registration failed: ${e}`));
	}
	
	#error(reason: string) {
		this.#errors.push(reason);
		this.#errorsElement.innerHTML = this.#errors.join('; ');
		this.#startButton.disabled = false;
	}
	
	#gotPersonalExamPassword(personalExamPassword: string) {
		const login = new Login(this.#nameElement.value, personalExamPassword);
		this.#loginController.write(login);
		this.refresh();
	}

	#gotList(list: Set<number>) {
		console.log('Got list', list);
		this.#navigate(list.values().next().value);
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
