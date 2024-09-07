import path from "path";
import fs from "fs";
import { getArrayFromFile, File } from "./utils/file.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the filename of the current module
const __filename = fileURLToPath(import.meta.url);

// Get the directory name of the current module
const __dirname = dirname(__filename);

// Get the parent directory
const parentDir = dirname(__dirname);

const playlistsDir = path.join(parentDir, "playlists");
const tmpFileName = path.join(parentDir, "playlists", "tmp.txt");

function checkmark(track) {
	return track.includes("✔️") ? "" : "✔️";
}

function lineWithCheckmark(track) {
	return `${track} ${checkmark(track)}` + "\n";
}

function lineWithX(track) {
	return `${track} X` + "\n";
}

class Progress {
	constructor({ playlist }) {
		this.playlist = playlist;
    this.playlistPath = path.join(parentDir, "playlists", playlist);
		this.tmpFile = new File(tmpFileName);
	}

	start() {
		this.tmpFile.clear();
	}

	submit(line) {
    console.log(line);
		this.tmpFile.append(line);
	}

	complete() {
		fs.renameSync(this.tmpFile.fileName, this.playlistPath);
	}
}

async function mockDownloadTrackList({ playlist, options }) {
	const progress = new Progress({playlist});
	progress.start();

	// Read the file track by track
	const fileTracks = getArrayFromFile(path.join(playlistsDir, playlist));
  const tracks = fileTracks.filter(track => !track.includes("✔️") && !track.includes("X"));

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
