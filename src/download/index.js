import { mockDownloadTrackList } from "./mock.js";
import { realDownloadTrackList } from "./playlist.js";

// Function to download all tracks from a list in a file
export async function downloadTrackList({ playlist, options }) {
	if (options.mock) {
		await mockDownloadTrackList({ playlist, options });
	} else {
		await realDownloadTrackList({ playlist, options });
	}
}
