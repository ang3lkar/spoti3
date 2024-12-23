import { saveToFile } from "./file.js";
import { getArrayFromFile } from "../utils/file.js";
import { hasBeenAttempted } from "./helpers.js";

export async function storePlaylist(playlist, options) {
	const { filename } = await saveToFile({
		playlist, options
	});

	return filename;
}

export function getPendingTracks(filename, options) {
	const playlistFilePath = path.join(process.cwd(), filename);

	const result = getArrayFromFile(playlistFilePath).filter(
		(track) => options.force || !hasBeenAttempted(track)
	).map(track => {
		const trackId = track.split(':')[0];
		return playlist.tracks.find(t => t.id === trackId);
	});

	return result;
}
