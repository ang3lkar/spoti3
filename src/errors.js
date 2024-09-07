export class QuotaExceededError extends Error {
	constructor(message) {
		super(message);
		this.name = "QuotaExceededError";
	}
}
