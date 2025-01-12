import { logger } from "../utils/logger.js";
import {
  fetchAccessToken,
  fetchPlaylistDetails,
  fetchPlaylistTracks,
} from "../gateway/spotify.js";

function enrichTrack(item) {
	// spotify returns different structure for playlist and album tracks
	const track = item.track || item;

	const artists = track.artists
		.map((artist) => artist.name)
		.join(", ");

	// Replace / with | to avoid creating folders when creating mp3 files
	const name = track.name.replace(/\//g, "|");

	const fullTitle = `${artists} - ${name}`;

	return {...track, fullTitle};
}

/**
 * Construct the playlist details and tracks using the Spotify API
 *
 * @param {*} spotifyId
 * @returns {Playlist} { name: string, tracks: string[] }
 */
export async function fetchPlaylist(spotifyId) {
  const accessToken = await fetchAccessToken();

  const playlistDetails = await fetchPlaylistDetails({ accessToken, spotifyId });
  const items = await fetchPlaylistTracks({ accessToken, spotifyId });

	const tracks = [];

	for (const item of items) {
		tracks.push(enrichTrack(item));
	}

  return { ...playlistDetails, tracks };
}
