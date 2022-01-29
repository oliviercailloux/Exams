export function verify(toVerify, message) {
	if (!toVerify) {
		throw new Error(message);
	}
}
