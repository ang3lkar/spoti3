import * as spotifyApi from "../api/spotify/spotify.js";
import { getArtists } from "../utils/spotify.js";
import { getOrdinalString } from "../utils/basic.js";

function shouldPrefixWithOrdinal(type) {
  return type === "album" || type === "playlist";
}

function enrichTrack({ item, ordinal, totalLength, type }) {
  // spotify returns different structure for playlist and album tracks
  const track = item.track || item;

  const artists = getArtists(track);

  // Replace / with | to avoid creating folders when creating mp3 files
  const name = track.name.replace(/\//g, "|");

  const prefix = shouldPrefixWithOrdinal(type)
    ? `${getOrdinalString(ordinal + 1, totalLength)}. `
    : "";
  const fullTitle = `${prefix}${artists} - ${name}`;

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
export async function fetchPlaylist(spotifyId, options = { spotifyApi }) {
  const accessToken = await options.spotifyApi.fetchAccessToken();

  const playlistDetails = await options.spotifyApi.fetchPlaylistDetails({
    accessToken,
    spotifyId,
  });

  const items = await options.spotifyApi.fetchTracks({
    accessToken,
    spotifyId,
  });

  const tracks = [];
  for (let i = 0; i < items.length; i++) {
    tracks.push(
      enrichTrack({
        item: items[i],
        ordinal: i,
        totalLength: items.length,
        type: spotifyId.type,
      })
    );
  }

  const folderName = getFolderName({ spotifyId, playlistDetails });
  return { ...playlistDetails, folderName, tracks };
}
