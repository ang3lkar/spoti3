import {
  fetchAccessToken,
  fetchPlaylistDetails,
  fetchPlaylistTracks,
} from "../gateway/spotify.js";

/**
 * Construct the playlist details and tracks using the Spotify API
 *
 * @param {*} playlistId
 * @returns {Playlist} { name: string, tracks: string[] }
 */
export async function fetchPlaylist(playlistId) {
  const accessToken = await fetchAccessToken();

  const playlistDetails = await fetchPlaylistDetails({ accessToken, playlistId });
  const tracks = await fetchPlaylistTracks({ accessToken, playlistId });

  return { ...playlistDetails, tracks };
}
