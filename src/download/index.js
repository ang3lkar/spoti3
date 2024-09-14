import { downloadTrackList } from "./playlist.js";

// Function to download all tracks from a list in a file
export async function download({ playlist, options }) {
	await downloadTrackList({ playlist, options });
}
