import "dotenv/config";
import fs from "fs";
import { titleToFriendlyName } from "../utils/basic.js";
import { PLAYLISTS_FOLDER } from "../constants.js";
import { hasBeenAttempted } from "./helpers.js";

function getPlaylistFileName(playlist) {
	return `${PLAYLISTS_FOLDER}/${titleToFriendlyName(
		playlist
	)}.txt`;
}

function saveToTextFileSync(data, filename) {
	fs.writeFileSync(filename, data.map(t => `${t.id}: ${t.trackTitle}`).join("\n"));
	console.log(`Playlist tracks saved to ${filename}`);
}

/**
 * Extracts playlist content from Spotify and saves it to a text file.
 *
 * @param {*} playlist The Spotify playlist object
 * @param {Object} force Whether to ignore all progress and start from the beginning
 * @returns {Promise<string>} The filename where the playlist was saved
 */
export async function saveToFile({playlist, options}) {
	try {
		const filename = getPlaylistFileName(playlist);

		if (!options.force && fs.existsSync(filename)) {
			console.log(`File ${filename} already exists. Skipping save.`);
			return { filename };
		}

		if (options.force) {
			console.log("Force option enabled. Overwriting existing file.");
			fs.rmSync(filename, { force: true });
		}

		if (!fs.existsSync(PLAYLISTS_FOLDER)) {
			fs.mkdirSync(PLAYLISTS_FOLDER);
		}

		saveToTextFileSync(playlist.tracks, filename);

		return { filename };
	} catch (error) {
		console.error("Error:", error.message);
	}
}

export async function getPendingTracksFromFile(playlist, options) {
	const filePath = path.join(process.cwd(), getPlaylistFileName(playlist));

	const result = getArrayFromFile(filePath).filter(
		(track) => options.force || !hasBeenAttempted(track)
	).map(track => {
		const trackId = track.split(':')[0];
		return playlist.tracks.find(t => t.id === trackId);
	});

	return result;
}
