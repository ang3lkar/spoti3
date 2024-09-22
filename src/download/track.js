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
		return { outcome: "MISSING_TRACK" };
	}

	if (track.includes(checkMark)) {
		console.log(`'${track}' already downloaded`);
		return { outcome: "SUCCESS" };
	}

	if (options.mock) {
		await delay(300);
		return { outcome: "SUCCESS" };
	}

	try {
		const searchResult = await searchYouTube(track);

		if (!searchResult) {
			return { outcome: "NO_VIDEO_FOUND" };
		}

		const videoId = searchResult.videoId;

		if (!fs.existsSync(downloadsDir)) {
			fs.mkdirSync(downloadsDir);
		}

		process.chdir(downloadsDir);

		mp3(track, videoId);

		return { outcome: "SUCCESS", mp3File: `${downloadsDir}/${track}` };
	} catch (error) {
		if (error instanceof QuotaExceededError) {
			throw error;
		}

		console.error("Error during track download:", error.message);
		return { outcome: "DOWNLOAD_ERROR" };
	}
}
