// a function that gets a title and converts it to a URL-friendly format
export function titleToFriendlyName(title) {
	// remove emojis
	title = title.replace(/[\u{1F600}-\u{1F6FF}]/gu, "");

	// remove special characters
	return title.replace(/\s/g, "_").toLowerCase();
}
