import { downloadTrackList } from "./playlist.js";
import { Progress } from "../utils/progress.js";
import { consola } from "consola";
import { storePlaylist, getPendingTracks } from "../store/index.js";
import { extractPlaylistId } from "../utils/spotify.js";
import { fetchPlaylist } from "../services/spotify.js";

async function askToProceed(tracks, playlist) {
	if (tracks.length === 0) {
		consola.info(`All tracks from ${playlist} playlist have been downloaded.`);
		process.exit();
	}

  const proceed = await consola.prompt(
    `Download ${tracks.length} remaining tracks from '${playlist}' playlist?`,
    {
      type: "confirm",
    }
  );

  if (!proceed) {
    console.log("bye bye!");
    process.exit();
  }
}

export async function download({ playlistUrl, options }) {
	try {
		const playlistId = extractPlaylistId(playlistUrl);

		const playlist = await fetchPlaylist(playlistId);

		await storePlaylist(playlist, options);

		const pendingTracks = await getPendingTracks(playlist, options);

		if (!options.force) {
			await askToProceed(pendingTracks, playlist.name);
		}

		const progress = new Progress(playlist);

		const album = options.album || playlist.name;
		await downloadTrackList({
			tracks: pendingTracks,
			progress,
			album,
			options
		});
	} catch(err) {
		console.error(`ERROR: ${err.message}`);
	}
}
