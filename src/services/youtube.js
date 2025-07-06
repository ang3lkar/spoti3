import * as youtubeApi from "../api/youtube/youtube.js";
import { extractYouTubeId, enrichYouTubeTrack } from "../utils/youtube.js";

function getFolderName({ youtubeId, playlistDetails }) {
  const type = Object.keys(youtubeId)[0];

  switch (type) {
    case "playlist":
      return playlistDetails.name;
    case "video":
      return `${playlistDetails.channelTitle} - ${playlistDetails.name}`;
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

  const playlistDetails = await options.youtubeApi.fetchPlaylistDetails({
    youtubeId: youtubeId.playlist,
  });

  const items = await options.youtubeApi.fetchTracks({
    youtubeId: youtubeId.playlist,
  });

  const tracks = [];
  for (const item of items) {
    tracks.push(enrichYouTubeTrack(item));
  }

  const folderName = getFolderName({ youtubeId, playlistDetails });
  return { ...playlistDetails, folderName, tracks };
}
