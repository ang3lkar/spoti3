import { logger } from "../utils/logger.js";
import { downloadTrackList } from "./playlist.js";
import { Progress } from "../utils/progress.js";
import { storePlaylist, getPendingTracks } from "../store/index.js";
import { extractSpotifyId } from "../utils/spotify.js";
import { fetchPlaylist } from "../services/spotify.js";
import { createDownloadFolder } from "../utils/file.js";

async function askToProceed(tracks, playlist) {
	if (tracks.length === 0) {
		logger.info(`All tracks from ${playlist} playlist have been downloaded.`);
		process.exit();
	}

  const proceed = await logger.prompt(
    `Download ${tracks.length} remaining tracks from '${playlist}' playlist?`,
    {
      type: "confirm",
    }
  );

  if (!proceed) {
    logger.info("bye bye!");
    process.exit();
  }
}

export async function download({ playlistUrl, options }) {
	try {
		const spotifyId = extractSpotifyId(playlistUrl);

		const playlist = await fetchPlaylist(spotifyId);

		await storePlaylist(playlist, options);

		const pendingTracks = await getPendingTracks(playlist, options);

		if (!options.force) {
			await askToProceed(pendingTracks, playlist.name);
		}

		createDownloadFolder(playlist.name);

		const progress = new Progress(playlist);

		const album = options.album || playlist.name;
		await downloadTrackList({
			playlist,
			tracks: pendingTracks,
			progress,
			album,
			options
		});
	} catch(err) {
		logger.error(err);
	}
}
