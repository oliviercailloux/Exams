export function verify(toVerify, message) {
    if (!toVerify) {
        throw new Error(message);
    }
}
export function checkDefined(toCheck, message) {
    if ((toCheck === undefined) || (toCheck === null)) {
        throw new Error(message);
    }
    return toCheck;
}
export function asArrayOrThrow(origin, message) {
    if (!Array.isArray(origin)) {
        throw new Error(message || `Expected array, got: ${origin}.`);
    }
    return origin;
}
export function asArrayOfIntegersOrThrow(origin, message) {
    const ar = asArrayOrThrow(origin);
    if (!ar.every(Number.isInteger)) {
        throw new Error(message || `Expected integers, got: ${origin}.`);
    }
    return ar;
}
export function asSetOfIntegersOrThrow(origin, message) {
    const ar = asArrayOfIntegersOrThrow(origin);
    const s = new Set(ar);
    if (ar.length !== s.size) {
        throw new Error(message || `Non-unique integers: ${origin}.`);
    }
    return s;
}
export function asElement(origin, message) {
    if (!(origin instanceof HTMLElement)) {
        throw new Error(message || `Not an element: ${origin}.`);
    }
    return origin;
}
export function asAnchor(origin, message) {
    if (!(origin instanceof HTMLAnchorElement)) {
        throw new Error(message || `Not an anchor: ${origin}.`);
    }
    return origin;
}
export function asInput(origin, message) {
    if (!(origin instanceof HTMLInputElement)) {
        throw new Error(message || `Not an input: ${origin}.`);
    }
    return origin;
}
export function asButton(origin, message) {
    if (!(origin instanceof HTMLButtonElement)) {
        throw new Error(message || `Not a button: ${origin}.`);
    }
    return origin;
}
