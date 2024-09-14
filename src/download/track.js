import { DOWNLOADS_FOLDER, checkMark } from "../constants.js";
import { QuotaExceededError } from "../errors.js";
import { searchYouTube } from "../search.js";
import fs from "fs";
import path from "path";
import { mp3 } from "../convert.js";
import { delay } from "../utils.js";

const downloadsDir = path.join(process.cwd(), DOWNLOADS_FOLDER);

// Function to search for a track and download it
export async function downloadTrack({ track, options }) {
	if (!track) {
		console.error("Missing track name");
		return false;
	}

	if (track.includes(checkMark)) {
		console.log(`'${track}' already downloaded`);
		return "SUCCESS";
	}

	if (options.mock) {
		await delay(1000);
		return "SUCCESS";
	}

	try {
		const searchResult = await searchYouTube(track);

		if (!searchResult) {
			return "NO_VIDEO_FOUND";
		}

		const videoId = searchResult.videoId;

		if (!fs.existsSync(downloadsDir)) {
			fs.mkdirSync(downloadsDir);
		}

		process.chdir(downloadsDir);

		mp3(track, videoId);

		return "SUCCESS";
	} catch (error) {
		if (error instanceof QuotaExceededError) {
			throw error;
		}

		console.error("Error during track download:", error.message);
		return "DOWNLOAD_ERROR";
	}
}
