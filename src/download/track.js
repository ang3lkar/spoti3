import { logger } from "../utils/logger.js";
import { DOWNLOADS_FOLDER, checkMark } from "../constants.js";
import { QuotaExceededError } from "../errors.js";
import { searchYouTube } from "../gateway/youtube.js";
import fs from "fs";
import path from "path";
import { mp3 } from "../convert/index.js";
import { delay } from "../utils/basic.js";
import { setTags } from "../tag/index.js";

const downloadsDir = path.join(process.cwd(), DOWNLOADS_FOLDER);

export async function downloadTrack({ playlist, track, tagOptions, downloadOptions }) {
	if (!track) {
		console.error("Missing track");
		return { outcome: "MISSING_TRACK" };
	}

	if (downloadOptions.mock) {
		await delay(300);
		return { outcome: "SUCCESS" };
	}

	const playlistFolder = path.join(downloadsDir, playlist.name);

	try {
		const searchResult = await searchYouTube(track.fullTitle);

		if (!searchResult) {
			return { outcome: "NO_VIDEO_FOUND" };
		}

		const videoId = searchResult.videoId;

		process.chdir(playlistFolder);

		const trackFilename = `${playlistFolder}/${track.fullTitle}.mp3`;

		logger.debug(`Downloading ${trackFilename}...`);

		if (!fs.existsSync(trackFilename)) {
			mp3(track.fullTitle, videoId);
		}

		tagOptions = {
			ordinal: tagOptions.ordinal,
			title: track.name,
			album: tagOptions.album || track.album.name,
			artist: track.artists.map(a => a.name).join("& ")
		};

		setTags(trackFilename, tagOptions);

		return { outcome: "SUCCESS", mp3File: trackFilename };
	} catch (error) {
		if (error instanceof QuotaExceededError) {
			throw error;
		}

		logger.error("Error during track download:", error.message);
		return { outcome: "DOWNLOAD_ERROR" };
	}
}
