import { logger } from "../../utils/logger.js";
import { downloadTrackList } from "./playlist.js";
import { extractSpotifyId } from "../../utils/spotify.js";
import { fetchPlaylist } from "../../services/spotify.js";
import { createDownloadFolder } from "../../utils/file.js";

export async function download({ playlistUrl, options }) {
  try {
    const spotifyId = extractSpotifyId(playlistUrl);

    const playlist = await fetchPlaylist(spotifyId);
    const album = options.album || playlist.name;

    createDownloadFolder(playlist.folderName);

    await downloadTrackList({
      playlist,
      tracks: playlist.tracks,
      album,
      options,
    });
  } catch (err) {
    logger.error(err.stack);
  }
}
