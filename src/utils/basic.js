export function extractPlaylistId(url) {
	const regex = /https?:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/;
	const match = url.match(regex);
	if (match) {
		return match[1];
	} else {
		throw new Error("Invalid Spotify playlist URL");
	}
}
