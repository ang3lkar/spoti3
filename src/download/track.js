import { DOWNLOADS_FOLDER, checkMark } from "../constants.js";
import { QuotaExceededError } from "../errors.js";
import { searchYouTube } from "../search.js";
import fs from "fs";
import path from "path";
import { mp3 } from "../convert.js";
import { delay } from "../utils.js";
import { setTags } from "../tag/index.js";

const downloadsDir = path.join(process.cwd(), DOWNLOADS_FOLDER);

export async function downloadTrack({ track, tagOptions, downloadOptions }) {
	if (!track) {
		console.error("Missing track name");
		return { outcome: "MISSING_TRACK" };
	}

	if (track.includes(checkMark)) {
		console.log(`'${track}' already downloaded`);
		return { outcome: "SUCCESS" };
	}

	if (downloadOptions.mock) {
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

		const trackFilename = `${downloadsDir}/${track}.mp3`;

		if (!fs.existsSync(trackFilename)) {
			mp3(track, videoId);
		}

		setTags(trackFilename, tagOptions);

		return { outcome: "SUCCESS", mp3File: `${downloadsDir}/${track}` };
	} catch (error) {
		if (error instanceof QuotaExceededError) {
			throw error;
		}

		console.error("Error during track download:", error.message);
		return { outcome: "DOWNLOAD_ERROR" };
	}
}
