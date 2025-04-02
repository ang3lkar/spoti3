import { logger } from "../utils/logger.js";
import {
  fetchAccessToken,
  fetchPlaylistDetails,
  fetchTracks,
} from "../gateway/spotify.js";

function getArtists(object) {
  return object.artists.map((artist) => artist.name).join(", ");
}

function enrichTrack(item) {
  // spotify returns different structure for playlist and album tracks
  const track = item.track || item;

  const artists = getArtists(track);

  // Replace / with | to avoid creating folders when creating mp3 files
  const name = track.name.replace(/\//g, "|");

  const fullTitle = `${artists} - ${name}`;

  return { ...track, fullTitle };
}

function getFolderName({ spotifyId, playlistDetails }) {
  switch (spotifyId.type) {
    case "playlist":
      return playlistDetails.name;
    case "album":
      return `${getArtists(playlistDetails)} - ${playlistDetails.name}`;
    case "track":
      return `Misc`;
    default:
      throw new Error(`Unknown Spotify ID type: ${spotifyId.type}`);
  }
}

/**
 * Construct the playlist details and tracks using the Spotify API
 *
 * @param {*} spotifyId
 * @returns {Playlist} { name: string, tracks: string[] }
 */
export async function fetchPlaylist(spotifyId) {
  const accessToken = await fetchAccessToken();

  const playlistDetails = await fetchPlaylistDetails({
    accessToken,
    spotifyId,
  });
  const items = await fetchTracks({ accessToken, spotifyId });

  const folderName = getFolderName({ spotifyId, playlistDetails });

  const tracks = [];

  for (const item of items) {
    tracks.push(enrichTrack(item));
  }

  return { ...playlistDetails, folderName, tracks };
}
