import { downloadTrack } from "./track.js";
import { lineWithCheckmark, lineWithX } from "./helpers.js";
import { QuotaExceededError } from "../errors.js";
import { consola } from "consola";

export async function downloadTrackList({ tracks, progress, options }) {
	let count = 0;
	let currentTrack;

	if (options.mock) {
		consola.warn(
			"Mock mode enabled. In this mode app will not search or download files to avoid reaching Youtube quotas.",
		);
	}

	progress.start();

	let total = tracks.length;

	consola.start("Downloading playlist...");

	const succeededTracks = [];
	const failedTracks = [];
	const pendingTracks = [...tracks];

	// Handle Ctrl+C (SIGINT)
	process.on("SIGINT", () => {
		console.log("\nCaught interrupt signal (Ctrl+C), cleaning up...");

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

		const tagOptions = {
			title: track,
			ordinal: count,
			album: options.album,
		}

		const downloadOptions = {
			...options
		}

		try {
			const result = await downloadTrack({ track, tagOptions, downloadOptions });

			const index = pendingTracks.indexOf(track);

			pendingTracks.splice(index, 1);

			if (result.outcome === "SUCCESS") {
				succeededTracks.push(track);
				progress.submit(lineWithCheckmark(track));
			} else {
				failedTracks.push(track);
				progress.submit(lineWithX(track));
			}
		} catch (err) {
			if (err instanceof QuotaExceededError) {
				console.error(
					"Error occurred while searching YouTube: Request failed with status code 403.",
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
