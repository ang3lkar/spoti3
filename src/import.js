import "dotenv/config";
import fs from "fs";
import { titleToFriendlyName } from "./utils.js";
import { PLAYLISTS_FOLDER } from "./constants.js";

function saveToTextFileSync(data, filename) {
	fs.writeFileSync(filename, data.map(t => `${t.id}: ${t.trackTitle}`).join("\n"));
	console.log(`Playlist tracks saved to ${filename}`);
}

/**
 * Extracts playlist content from Spotify and saves it to a text file
 *
 * @param {*} playlist The Spotify playlist object
 * @returns {Promise<string>} The filename where the playlist was saved
 */
export async function saveToFile({playlist, options}) {
	try {
		const filename = `${PLAYLISTS_FOLDER}/${titleToFriendlyName(
			playlist
		)}.txt`;

		if (!options.force && fs.existsSync(filename)) {
			console.log(`File ${filename} already exists. Skipping save.`);
			return { filename };
		}

		if (options.force) {
			console.log("Force option enabled. Overwriting existing file.");
			// Remove the file if it exists
			fs.rmSync(filename, { force: true });
		}

		saveToTextFileSync(playlist.tracks, filename);

		return { filename };
	} catch (error) {
		console.error("Error:", error.message);
	}
}
