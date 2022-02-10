export function verify(toVerify: boolean, message: string) {
	if (!toVerify) {
		throw new Error(message);
	}
}
