import { logger } from "../../utils/logger.js";
import * as youtubeApi from "../../api/youtube/index.js";
import { extractYouTubeId, enrichYouTubeTrack } from "./utils.js";
import { greekToLatin } from "../../utils/basic.js";

function getFolderName({ youtubeId, playlistDetails }) {
  const { type } = youtubeId;

  switch (type) {
    case "playlist":
      return greekToLatin(playlistDetails.name);
    case "video":
      return greekToLatin(playlistDetails.name);
    case "channel":
      return greekToLatin(`Channel: ${playlistDetails.channelTitle}`);
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
  try {
    const youtubeId = extractYouTubeId(url);
    const api = options.youtubeApi || youtubeApi;

    const playlistDetails = await api.fetchPlaylistDetails({
      youtubeId,
      options: {},
    });

    const playlistItems = await api.fetchTracks({
      youtubeId,
      options: {},
    });

    const tracks = [];
    for (const item of playlistItems) {
      tracks.push(await enrichYouTubeTrack(item));
    }

    const folderName = getFolderName({ youtubeId, playlistDetails });
    return { ...playlistDetails, folderName, tracks };
  } catch (err) {
    logger.error(err.stack);
    throw err;
  }
}
