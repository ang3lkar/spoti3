import { logger } from "../utils/logger.js";

/**
 * Get a comma-separated string of artist names from a Spotify object
 *
 * @param {*} object A Spotify object containing an artists array
 * @returns {string} A comma-separated string of artist names
 */
export function getArtists(object) {
  if (!object?.artists) {
    return "";
  }
  return object.artists.map((artist) => artist.name).join(", ");
}

export function extractSpotifyId(url) {
  logger.debug("Extracting Spotify ID from spotify URL");

  const regex =
    /https?:\/\/open\.spotify\.com\/(playlist|album|track)\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  if (match) {
    logger.debug(
      `Extracted Spotify ID from spotify URL (type=${match[1]}) (spotifyId=${match[2]})`
    );

    return { type: match[1], value: match[2] };
  } else {
    throw new Error("Invalid Spotify URL");
  }
}

/**
 * Get the search term for a track.
 *
 * @param {*} track
 * @param {*} playlist
 * @returns
 */
export function getSearchTerm(track, playlist) {
  // If album is a live one, concatenate the album and track name to enforce the
  // specific version of the track instead of the original.
  return playlist.album_type === "album"
    ? `${track.fullTitle} / ${playlist.name}`
    : track.fullTitle;
}

/**
 * Get the image URL for a track
 *
 * @param {*} track
 * @param {*} playlist
 * @returns
 */
export function getTrackImageUrl(track, playlist) {
  return track.album ? track.album.images[0].url : playlist.images[0].url;
}
