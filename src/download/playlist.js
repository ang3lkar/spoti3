import { downloadTrack } from "./track.js";
import { getArrayFromFile } from "../utils/file.js";
import { lineWithCheckmark, lineWithX, hasBeenAttempted } from "./helpers.js";
import { PLAYLISTS_FOLDER } from "../constants.js";
import { Progress } from "../utils/progress.js";
import { QuotaExceededError } from "../errors.js";
import path from "path";
import {consola} from "consola";

export async function downloadTrackList({ playlist, options }) {
	let count = 0;
	let currentTrack;

	const playlistFilePath = path.join(process.cwd(), PLAYLISTS_FOLDER, playlist);

  const progress = new Progress({ playlistFilePath });

	if (options.mock) {
		consola.warn('Mock mode enabled. In this mode app will not search and download files to avoid reaching Youtube quotas.')
	}

	progress.start();

	const tracks = getArrayFromFile(playlistFilePath).filter((track) =>
		!hasBeenAttempted(track)
	);

	let total = tracks.length;

	if (total === 0) {
		consola.success("All tracks have been downloaded!");
		process.exit(1);
	}

	const proceed = await consola.prompt(`Download ${total} tracks from ${playlist} playlist?`, {
		type: "confirm",
	});

	if (!proceed) {
		console.log("bye bye!");
		process.exit(1);
	}

	consola.start('Downloading playlist...');

	const succeededTracks = [];
	const failedTracks = [];
	const pendingTracks = [...tracks];

	// Handle Ctrl+C (SIGINT)
	process.on('SIGINT', () => {
		console.log('\nCaught interrupt signal (Ctrl+C), cleaning up...');

		// bring current track back to pending to download next time
		pendingTracks.push(currentTrack);

		// Write the rest of the tracks to the file
		for (const track of pendingTracks) {
			progress.submit(`${track}\n`);
		}

		progress.complete();

		// After cleanup, exit the process
		process.exit();
	});

	for (const track of tracks) {
		count += 1;
		currentTrack = track;
		console.log(`Downloading ${count}/${total} "${track}"`);

		try {
			const result = await downloadTrack({track, options});

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

			consola.error(err);

			// bring current track back to pending to download next time
			pendingTracks.push(track);

			// Write the rest of the tracks to the file
			for (const track of pendingTracks) {
				progress.submit(`${track}\n`);
			}
		}
	}

	progress.complete();

	process.exit();
}

