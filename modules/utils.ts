export function verify(toVerify: boolean, message?: string) {
	if (!toVerify) {
		throw new Error(message);
	}
}

export function checkDefined<T>(toCheck: T | undefined | null, message?: string) {
	if((toCheck === undefined) || (toCheck === null)) {
		throw new Error(message);
	}
	return toCheck;
}

export function asArrayOrThrow(origin: any | undefined | null, message?: string) {
	if(!Array.isArray(origin)) {
		throw new Error(message || `Expected array, got: ${origin}.`);
	}
	return origin;
}

export function asArrayOfIntegersOrThrow(origin: any | undefined | null, message?: string) {
	const ar = asArrayOrThrow(origin);
	if(!ar.every(Number.isInteger)) {
		throw new Error(message || `Expected integers, got: ${origin}.`);
	}
	return ar as Array<number>;
}

export function asSetOfIntegersOrThrow(origin: any | undefined | null, message?: string) {
	const ar = asArrayOfIntegersOrThrow(origin);
	const s = new Set(ar);
	if(ar.length !== s.size) {
		throw new Error(message || `Non-unique integers: ${origin}.`);
	}
	return s;
}

export function asElement(origin: any, message?: string) {
	if(!(origin instanceof HTMLElement)) {
		throw new Error(message || `Not an element: ${origin}.`);
	}
	return origin;
}

export function asAnchor(origin: any, message?: string) {
	if(!(origin instanceof HTMLAnchorElement)) {
		throw new Error(message || `Not an anchor: ${origin}.`);
	}
	return origin;
}

export function asInput(origin: any, message?: string) {
	if(!(origin instanceof HTMLInputElement)) {
		throw new Error(message || `Not an input: ${origin}.`);
	}
	return origin;
}

export function asButton(origin: any, message?: string) {
	if(!(origin instanceof HTMLButtonElement)) {
		throw new Error(message || `Not a button: ${origin}.`);
	}
	return origin;
}