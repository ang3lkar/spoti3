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

	let trackFilename;
	const playlistFolder = path.join(downloadsDir, playlist.folderName);

	try {
		const searchResult = await searchYouTube(track.fullTitle);

		if (!searchResult) {
			return { outcome: "NO_VIDEO_FOUND" };
		}

		const videoId = searchResult.videoId;

		process.chdir(playlistFolder);

		trackFilename = `${playlistFolder}/${track.fullTitle}.mp3`;

		logger.debug(`Downloading ${trackFilename}...`);

		if (!fs.existsSync(trackFilename)) {
			mp3(track.fullTitle, videoId);
		}

	} catch (err) {
		if (err instanceof QuotaExceededError) {
			throw err;
		}

		logger.error(err);
		return { outcome: "DOWNLOAD_ERROR", error: err };
	}

	try {
		tagOptions = {
			ordinal: tagOptions.ordinal,
			title: track.name,
			album: tagOptions.album || track.album?.name || playlist.name,
			artist: track.artists.map(a => a.name).join("& ")
		};

		setTags(trackFilename, tagOptions);
	} catch (err) {
		logger.error(err.message);
	}

	return { outcome: "SUCCESS", mp3File: trackFilename };
}
