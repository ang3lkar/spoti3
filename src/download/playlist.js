import { QuotaExceededError } from "../errors.js";
import fs from "fs";

export async function realDownloadTrackList({playlist, options}) {
  const tmpFilePath = path.join(__dirname, `tmp_${filePath}`);
	const tmpFile = fs.createWriteStream(tmpFilePath);

	// Read the file line by line
	const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean);

	let count = 0;
	let total = lines.length;

	console.log(`Playlist tracks: ${total}`);
	console.log("---");

	const restOfTracks = [...lines];
	const downloadedTracks = [];
	const failedTracks = [];

	for (const line of lines) {
		count += 1;
		console.log(`Downloading ${count}/${total} "${line}"`);

		try {
			const result = await downloadTrack(line);

			const index = restOfTracks.indexOf(line);
			restOfTracks.splice(index, 1);

			if (result === "SUCCESS") {
				console.log(`${result}! ✔️`);

				downloadedTracks.push(line);

				tmpFile.write(`${line} ${line.includes("✔️") ? "" : "✔️"}\n`);
			} else {
				console.log(`${result}! X`);

				failedTracks.push(line);

				tmpFile.write(`${line} X\n`);
			}
		} catch (err) {
			if (err instanceof QuotaExceededError) {
				console.error(
					"Error occurred while searching YouTube: Request failed with status code 403."
				);
				console.error("Youtube daily quota exceeded. Exiting...");

				// bring back the rest of the tracks to download next time
				restOfTracks.push(line);
			}

			// Write the rest of the tracks to the file
			for (const track of restOfTracks) {
				tmpFile.write(`${track}\n`);
			}

			tmpFile.end();

			tmpFile.on("finish", () => {
				// move to parent folder
				process.chdir(__dirname);

				// Replace the original file with the modified content
				fs.renameSync(tmpFilePath, filePath);

				console.log("fin! talk tomorrow!");

				process.exit(1);
			});
		}
		console.log("---");
	}

	tmpFile.end();

	tmpFile.on("finish", () => {
		// move to parent folder
		process.chdir(__dirname);

		// Replace the original file with the modified content
		fs.renameSync(tmpFilePath, filePath);

		console.log("fin!");

		process.exit(1);
	});
}
