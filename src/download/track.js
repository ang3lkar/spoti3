import { DOWNLOADS_FOLDER } from "../constants.js";
import { QuotaExceededError } from "../errors.js";
import { searchYouTube } from "../search.js";
import fs from "fs";
import path from "path";
import { mp3 } from "../convert.js";

const downloadsDir = path.join(process.cwd(), DOWNLOADS_FOLDER);

// Function to search for a track and download it
export async function downloadTrack(track) {
	if (!track) {
		console.error("Missing track name");
		return false;
	}

	if (track.includes("✔")) {
		console.log("Track already downloaded");
		return "SUCCESS";
	}

	try {
		const searchResult = await searchYouTube(track);

		if (!searchResult) {
			return "NO_VIDEO_FOUND";
		}

		const videoId = searchResult.videoId;

		console.log(`\nVideo ID: ${videoId}`);

		if (!fs.existsSync(downloadsDir)) {
			fs.mkdirSync(downloadsDir);
		}

		process.chdir(downloadsDir);

		// Call the mp3 function with the video ID
		mp3(videoId);

		return "SUCCESS";
	} catch (error) {
		if (error instanceof QuotaExceededError) {
			throw error;
		}

		console.error("Error during track download:", error.message);
		return "DOWNLOAD_ERROR";
	}
}
