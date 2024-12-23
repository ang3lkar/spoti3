function removeEmojis(text) {
	return text.replace(/[\u{1F600}-\u{1F6FF}]/gu, "");
}

function removeSpecialCharacters(text) {
	return text.replace(/[^\w\s]/gi, "");
}

/**
 * Converts a title to a friendly filename, no spaces and irregular chars and adding the playlist id
 *
 * @param {*} playlist The Spotify playlist object
 * @returns A string representing the friendly filename
 */
export function titleToFriendlyName(playlist) {
	const {id, name} = playlist;

	let result = name;

	result = removeEmojis(result);
	result = removeSpecialCharacters(result);
	result = result.replace(/\s/g, "-");

	result = `${result}-${id}`;

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
