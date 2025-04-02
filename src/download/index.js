import { logger } from "../utils/logger.js";
import { downloadTrackList } from "./playlist.js";
import { Progress } from "../utils/progress.js";
import { storePlaylist, getPendingTracks } from "../store/index.js";
import { extractSpotifyId } from "../utils/spotify.js";
import { fetchPlaylist } from "../services/spotify.js";
import { createDownloadFolder } from "../utils/file.js";

async function askToProceed({ pendingTracks, spotifyId, name }) {
  if (pendingTracks.length === 0) {
    const exitMessage =
      spotifyId.type === "track"
        ? `The track "${name}" has already been downloaded.`
        : `All tracks from ${name} ${spotifyId.type} have already been downloaded.`;
    logger.info(exitMessage);
    process.exit();
  }

  const promptMessage =
    spotifyId.type === "track"
      ? "Download this track?"
      : `Download ${pendingTracks.length} remaining tracks from the '${name}' ${spotifyId.type}?`;

  const proceed = await logger.prompt(promptMessage, {
    type: "confirm",
  });

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
      await askToProceed({ pendingTracks, spotifyId, name: playlist.name });
    }

    createDownloadFolder(playlist.folderName);

    const progress = new Progress(playlist);

    const album = options.album || playlist.name;

    await downloadTrackList({
      playlist,
      tracks: pendingTracks,
      progress,
      album,
      options,
    });
  } catch (err) {
    logger.error(err);
  }
}
