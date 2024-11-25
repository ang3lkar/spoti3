import { downloadTrackList } from "./playlist.js";
import path from "path";
import { Progress } from "../utils/progress.js";
import { getArrayFromFile } from "../utils/file.js";
import { hasBeenAttempted } from "./helpers.js";
import { consola } from "consola";
import { saveToFile } from "../import.js";
import {
  fetchAccessToken,
  fetchPlaylistDetails,
  fetchPlaylistTracks,
} from "../gateway/spotify.js";
import { extractPlaylistId } from "../utils/basic.js";

/**
 * Construct the playlist details and tracks using the Spotify API
 *
 * @param {*} playlistId
 * @returns {Playlist} { name: string, tracks: string[] }
 */
export async function getPlaylistDetails(playlistId) {
  const accessToken = await fetchAccessToken();

  const details = await fetchPlaylistDetails({ accessToken, playlistId });
  const tracks = await fetchPlaylistTracks({ accessToken, playlistId });

  // TODO: Keep tracks original ordering so as to set the correct track number
  // on the mp3 files
  const sortedTracks = tracks.sort();

  return { ...details, tracks: sortedTracks };
}

async function askToProceed(tracks, playlist) {
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
  const playlist = await getPlaylistDetails(extractPlaylistId(playlistUrl));

  const { filename } = await saveToFile({
    playlist, options
  });

  const album = options.album || playlist.name;
  const playlistFilePath = path.join(process.cwd(), filename);

  const pendingTracks = getArrayFromFile(playlistFilePath).filter(
    (track) => !hasBeenAttempted(track)
  );

  await askToProceed(pendingTracks, playlist.name);

  const progress = new Progress({ playlistFilePath });

  await downloadTrackList({ tracks: pendingTracks, progress, album, options });
}
