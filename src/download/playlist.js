import { downloadTrack } from "./track.js";
import { getArrayFromFile } from "../utils/file.js";
import { lineWithCheckmark, lineWithX, hasBeenAttempted } from "./helpers.js";
import { PLAYLISTS_FOLDER } from "../constants.js";
import { Progress } from "../utils/progress.js";
import { QuotaExceededError } from "../errors.js";
import path from "path";

export async function downloadTrackList({ playlist, options }) {
	const playlistFilePath = path.join(process.cwd(), PLAYLISTS_FOLDER, playlist);

  const progress = new Progress({ playlistFilePath });

	progress.start();

	const tracks = getArrayFromFile(playlistFilePath).filter((track) =>
		!hasBeenAttempted(track)
	);

	let count = 0;
	let total = tracks.length;

	if (total === 0) {
		console.log("All tracks have been downloaded");
		process.exit(1);
	}

	console.log(`Number of tracks: ${total}`);
	console.log("---");

	const succeededTracks = [];
	const failedTracks = [];
	const pendingTracks = [...tracks];

	for (const track of tracks) {
		count += 1;
		console.log(`Downloading ${count}/${total} "${track}"`);

		try {
			const result = await downloadTrack(track);

			const index = pendingTracks.indexOf(track);

			pendingTracks.splice(index, 1);

			if (result === "SUCCESS") {
				succeededTracks.push(track);
				progress.submit(lineWithCheckmark(track));
			} else {
				failedTracks.push(track);
				progress.submit(lineWithX(track));
			}
		} catch (err) {
			if (err instanceof QuotaExceededError) {
				console.error(
					"Error occurred while searching YouTube: Request failed with status code 403."
				);
				console.error("Youtube daily quota exceeded. Exiting...");
			}

			console.error(err);
			// bring current track back to pending to download next time
			pendingTracks.push(track);

			// Write the rest of the tracks to the file
			for (const track of pendingTracks) {
				progress.submit(`${track}\n`);
			}
		}
	}

	progress.complete();

	console.log("fin! talk tomorrow!");

	process.exit(1);
}

