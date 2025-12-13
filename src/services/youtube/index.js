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
      throw new Error(`Unknown YouTube ID type: ${youtubeId.type}`);
  }
}

/**
 * Construct the playlist details and tracks using the YouTube API
 *
 * @param {string} url YouTube playlist/video URL
 * @param {object} options Options object
 * @returns {object} { name: string, tracks: object[], folderName: string }
 */
export async function fetchPlaylist(url, options = { youtubeApi, source }) {
  const youtubeId = extractYouTubeId(url);

  const playlistDetails = await youtubeApi.fetchPlaylistDetails({
    youtubeId,
  });

  const tracks = [];
  for (const item of playlistDetails.tracks) {
    tracks.push(enrichYouTubeTrack(item));
  }

  const folderName = getFolderName({ youtubeId, playlistDetails });
  return { ...playlistDetails, folderName, tracks };
}
