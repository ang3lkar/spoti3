import { logger } from "../../utils/logger.js";
import * as youtubeApi from "../../api/youtube/index.js";
import { extractYouTubeId, enrichYouTubeTrack } from "./utils.js";

function getFolderName({ youtubeId, playlistDetails }) {
  const { type } = youtubeId;

  switch (type) {
    case "playlist":
      return playlistDetails.name;
    case "video":
      return playlistDetails.name;
    case "channel":
      return `Channel: ${playlistDetails.channelTitle}`;
    default:
      throw new Error(`Unsupported YouTube ID type: ${youtubeId.type}`);
  }
}

/**
 * Construct the playlist details and tracks using the YouTube API
 *
 * @param {string} url YouTube playlist/video URL
 * @param {object} options Options object
 * @returns {object} { name: string, tracks: object[], folderName: string }
 */
export async function fetchPlaylist(url, options = { youtubeApi }) {
  const { logger: log = logger } = options;
  try {
    const youtubeId = extractYouTubeId(url, { logger: log });
    const api = options.youtubeApi || youtubeApi;

    const playlistDetails = await api.fetchPlaylistDetails({
      youtubeId,
      options: { logger: log },
    });

    const playlistItems = await api.fetchTracks({
      youtubeId,
      options: { logger: log },
    });

    const tracks = [];
    for (const item of playlistItems) {
      tracks.push(enrichYouTubeTrack(item));
    }

    const folderName = getFolderName({ youtubeId, playlistDetails });
    return { ...playlistDetails, folderName, tracks };
  } catch (err) {
    log.error(err.stack);
    throw err;
  }
}
