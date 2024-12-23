import { downloadTrackList } from "./playlist.js";
import { Progress } from "../utils/progress.js";
import { consola } from "consola";
import { storePlaylist, getPendingTracks } from "../store/index.js";
import {
  fetchAccessToken,
  fetchPlaylistDetails,
  fetchPlaylistTracks,
} from "../gateway/spotify.js";
import { extractPlaylistId } from "../utils/spotify.js";

/**
 * Construct the playlist details and tracks using the Spotify API
 *
 * @param {*} playlistId
 * @returns {Playlist} { name: string, tracks: string[] }
 */
export async function getPlaylistDetails(playlistId) {
  const accessToken = await fetchAccessToken();

  const details = await fetchPlaylistDetails({ accessToken, playlistId });
  const tracks = (await fetchPlaylistTracks({ accessToken, playlistId }))
		.map((track) => {
			return {
				...track,
				trackTitle: track.trackTitle
			}});

  return { ...details, tracks };
}

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
		const playlist = await getPlaylistDetails(extractPlaylistId(playlistUrl));

		const { filename } = await storePlaylist(playlist, options);

		const pendingTracks = getPendingTracks(filename, options);

		if (!options.force) {
			await askToProceed(pendingTracks, playlist.name);
		}

		const progress = new Progress({ playlistFilePath });

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
