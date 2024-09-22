import { downloadTrackList } from "./playlist.js";
import { PLAYLISTS_FOLDER } from "../constants.js";
import path from 'path';
import { Progress } from '../utils/progress.js';
import { getArrayFromFile } from "../utils/file.js";
import { hasBeenAttempted } from "./helpers.js";
import { consola } from "consola";

async function askToProceed(tracks, playlist) {
	const proceed = await consola.prompt(
		`Download ${tracks.length} remaining tracks from ${playlist} playlist?`,
		{
			type: "confirm",
		},
	);

	if (!proceed) {
		console.log("bye bye!");
		process.exit();
	}
}

export async function download({ playlist, options }) {
	const playlistFilePath = path.join(process.cwd(), PLAYLISTS_FOLDER, playlist);

	const tracks = getArrayFromFile(playlistFilePath).filter(
		(track) => !hasBeenAttempted(track),
	);

	await askToProceed(tracks, playlist);

	const progress = new Progress({ playlistFilePath });

	await downloadTrackList({ tracks, progress, options });
}
