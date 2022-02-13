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