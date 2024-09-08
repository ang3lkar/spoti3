import { mockDownloadTrackList } from "./mock.js";
import { downloadTrackList } from "./playlist.js";

// Function to download all tracks from a list in a file
export async function download({ playlist, options }) {
	if (options.mock) {
		await mockDownloadTrackList({ playlist, options });
	} else {
		await downloadTrackList({ playlist, options });
	}
}
