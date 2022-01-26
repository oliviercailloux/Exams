import Requester from './modules/support.mjs';
import { Login, LoginController } from './modules/login.mjs';

if (window.location.protocol !== 'https:' && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
	throw new Error('Protocol should be https.');
}

class Controller {
	login;
	requester;
	ids;
	id;
	index;
	questionElements;
	acceptedClaims;

	previousButton;
	nextButton;
	endButton;
	contentsDiv;
	checkboxElements;

	constructor() {
		this.login = new LoginController().readLogin();
		if (this.login === undefined) {
			throw new Error('No login.');
		}
		this.requester = new Requester();
		this.ids = null;
		this.id = null;
		this.index = null;
		this.questionElements = null;
		this.acceptedClaims = null;

		this.previousButton = document.getElementById('previous');
		this.nextButton = document.getElementById('next');
		this.endButton = document.getElementById('end');
		this.contentsDiv = document.getElementById('contents');

		this.previousButton.addEventListener('click', e => this.previous.call(this, e));
		this.nextButton.addEventListener('click', e => this.next.call(this, e));
		this.endButton.addEventListener('click', e => this.end.call(this, e));

		this.checkboxElements = null;
	}

	fetchIds() {
		this.requester.list(this.login, r => this.listed.call(this, r));
	}

	listed(response) {
		response.json().then(l => this.gotIds.call(this, l));
	}

	gotIds(ids) {
		console.log('Got ids', ids);
		this.ids = ids;
		this.refresh();
	}

	getIdFromHash() {
		if (!window.location.hash[0] === '#') {
			throw new Error('No fragment.');
		}
		const requested = window.location.hash.substring(1);
		if (requested === "") {
			throw new Error('Empty fragment.');
		}
		const id = parseInt(requested, 10);
		if (Number.isNaN(id)) {
			throw new Error('Non numeric fragment.');
		}
		return id;
	}

	/* If has questionElements already, id must be set to the current one. */
	refresh() {
		console.log('Refreshing, id', this.id, 'ids', this.ids, 'questionElements', this.questionElements, 'acceptedClaims', this.acceptedClaims);
		if (this.questionElements !== null) {
			if (this.id === null) {
				throw new Error("Has ids but no question id.");
			}
			if (this.id !== this.getIdFromHash()) {
				throw new Error("Known id does not match expected id.");
			}
		}

		if (this.id === null) {
			this.id = this.getIdFromHash();
			this.requester.getQuestion(this.login, this.id, r => this.phrased.call(this, r), r => this.adopted.call(this, r));
		}
		if (this.ids === null) {
			this.fetchIds();
		}

		if (this.ids !== null && this.id !== null) {
			if (!this.ids.includes(this.id)) {
				throw new Error('Unknown id', id);
			}
			this.index = this.ids.indexOf(this.id);

			const firstQuestion = this.index === 0;
			const lastQuestion = this.index === this.ids.length - 1;
			this.previousButton.hidden = firstQuestion;
			this.nextButton.hidden = lastQuestion;
			this.endButton.hidden = !lastQuestion;
		}
		if (this.questionElements !== null && this.acceptedClaims != null && this.contentsDiv.children.length === 0) {
			console.log('Appending', this.questionElements);
			for (let i = 0; i < this.questionElements.length; ++i) {
				this.contentsDiv.appendChild(this.questionElements[i]);
			}

			const inputs = Array.from(document.getElementsByTagName('input'));
			console.log('Inputs found', inputs);
			this.checkboxElements = inputs.filter(i => i.attributes.getNamedItem('type').value === 'checkbox');
			console.log('checkboxElements found', this.checkboxElements);
			this.checkboxElements.forEach(c => c.addEventListener('click', e => this.check.call(this, e)));
			for (let i = 0; i < this.acceptedClaims.length; ++i) {
				const acceptedIndexOneBased = this.acceptedClaims[i];
				this.checkboxElements[acceptedIndexOneBased - 1].checked = true;
			}
		}

		Document.title = `Question ${this.id}`;
	}

	navigateTo(id) {
		this.contentsDiv.innerHTML = '';
		this.id = null;
		this.index = null;
		this.questionElements = null;
		this.acceptedClaims = null;

		console.log('Navigating to', id);
		window.location.hash = `#${id}`;
		this.refresh();
	}

	phrased(response) {
		console.log('Phrasing answered', response);
		response.text().then(p => this.gotPhrasing.call(this, p));
	}

	gotPhrasing(phrasingText) {
		console.log('Got phrasing', phrasingText);
		const phrasingDoc = new DOMParser().parseFromString(phrasingText, 'application/xhtml+xml');
		const body = phrasingDoc.body;
		console.log('Got body', body);
		const children = body.children;
		const sectionChildren = Array.from(children).filter(e => e.tagName === 'section');
		if (sectionChildren.length != 1) {
			throw new Error('Unexpected sections inside body in ' + phrasingText);
		}
		const sectionElement = sectionChildren[0];
		const questionElements = Array.from(sectionElement.children);
		if (questionElements.length === 0) {
			throw new Error('No content');
		}
		this.questionElements = questionElements;
		this.refresh();
	}

	check(event) {
		this.requester.answer(this.login, this.id, this.getChecked(), r => this.answered.call(this, r));
	}
	
	answered(response) {
		console.log('Registered answer.', response);
	}

	adopted(response) {
		console.log('Answered', response);
		if (response.status === 200) {
			response.json().then(p => this.gotAcceptedClaims.call(this, p));
		} else {
			this.gotAcceptedClaims(new Array());
		}
	}

	gotAcceptedClaims(acceptedClaims) {
		this.acceptedClaims = acceptedClaims;
		this.refresh();
	}

	getChecked() {
		return this.checkboxElements.filter(c => c.checked).map(c => c.id).map(this.claimIdToInt);
	}

	claimIdToInt(claimId) {
		if (claimId.substring(0, 6) !== 'claim-') {
			throw new Error('Unknown claim id', claimId);
		}
		const idString = claimId.substring(6);
		const id = parseInt(idString, 10);
		if (Number.isNaN(id)) {
			throw new Error('Non numeric claim id.');
		}
		return id;
	}

	previous(event) {
		if (this.index === null) {
			throw new Error('No index yet.');
		}
		if (this.index === 0) {
			throw new Error('No previous question.');
		}

		this.navigateTo(this.ids[this.index - 1]);
	}

	next(event) {
		if (this.index === null) {
			throw new Error('No index yet.');
		}
		if (this.index === this.ids.length - 1) {
			throw new Error('No next question.');
		}

		this.navigateTo(this.ids[this.index + 1]);
	}

	end(event) {
		if (this.index === null) {
			throw new Error('No index yet.');
		}
		if (this.index !== this.ids.length - 1) {
			throw new Error('Not at end of questions.');
		}

		window.location.href = 'end.html';
	}
}

new Controller().refresh();
