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
		console.error("Missing track");
		return { outcome: "MISSING_TRACK" };
	}

	if (downloadOptions.mock) {
		await delay(300);
		return { outcome: "SUCCESS" };
	}

	try {
		const searchResult = await searchYouTube(track.trackTitle);

		if (!searchResult) {
			return { outcome: "NO_VIDEO_FOUND" };
		}

		const videoId = searchResult.videoId;

		if (!fs.existsSync(downloadsDir)) {
			fs.mkdirSync(downloadsDir);
		}

		process.chdir(downloadsDir);

		const trackFilename = `${downloadsDir}/${track.trackTitle}.mp3`;

		if (!fs.existsSync(trackFilename)) {
			mp3(track.trackTitle, videoId);
		}

		tagOptions = {
			ordinal: tagOptions.ordinal,
			title: track.name,
			album: tagOptions.album || track.album.name,
			artist: track.artists.map(a => a.name).join("& ")
		};

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
