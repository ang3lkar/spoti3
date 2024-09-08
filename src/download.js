import path from "path";
import { getArrayFromFile } from "./utils/file.js";
import { Progress } from "./utils/progress.js";
import { PLAYLISTS_FOLDER } from "./constants.js";

function checkmark(track) {
	return track.includes("✔️") ? "" : "✔️";
}

function lineWithCheckmark(track) {
	return `${track} ${checkmark(track)}` + "\n";
}

function lineWithX(track) {
	return `${track} X` + "\n";
}

function nonDownloaded(track) {
	return !track.includes("✔️") && !track.includes("X");
}

async function mockDownloadTrackList({ playlist, options }) {
	const playlistFilePath = path.join(process.cwd(), PLAYLISTS_FOLDER, playlist);

  const progress = new Progress({ playlistFilePath });

	progress.start();

	const tracks = getArrayFromFile(playlistFilePath).filter((track) =>
		nonDownloaded(track)
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
			const result = "SUCCESS"; // mock

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
			console.error(err);

			// bring current track back to pending to download next time
			pendingTracks.push(track);
		}

		// Write the rest of the tracks to the file
		for (const track of pendingTracks) {
			progress.submit(`${track}\n`);
		}
	}

	progress.complete();

	console.log("fin! talk tomorrow!");

	process.exit(1);
}

// Function to download all tracks from a list in a file
export async function downloadTrackList({ playlist, options }) {
	if (options.mock) {
		await mockDownloadTrackList({ playlist, options });
	} else {
		await realDownloadTrackList({ playlist, options });
	}
}
