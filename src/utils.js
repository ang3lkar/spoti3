function removeEmojis(text) {
	return text.replace(/[\u{1F600}-\u{1F6FF}]/gu, "");
}

function removeSpecialCharacters(text) {
	return text.replace(/[^\w\s]/gi, "");
}

/**
 * Converts a video title to a friendly filename
 *
 * @param {*} title A string representing the title of a video
 * @returns A string representing a friendly filename for the video
 */
export function titleToFriendlyName(title) {
	let result = title;

	result = removeEmojis(result);
	result = removeSpecialCharacters(result);

	return result;
}

/**
 * A function to delay the execution of a promise
 *
 * @param {*} ms The number of milliseconds to wait
 * @returns
 */
export function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
