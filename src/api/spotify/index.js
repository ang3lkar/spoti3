import axios from "axios";
import { logger } from "../../utils/logger.js";
import { api } from "../../config/index.js";

const { CLIENT_ID, CLIENT_SECRET, TOKEN_URL, API_BASE_URL } = api.SPOTIFY;

/**
 * Get an temporary access token from Spotify
 * @returns {string} The access token
 */
export async function fetchAccessToken() {
  const authOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
    },
    data: "grant_type=client_credentials", // Manually encoded body
    url: TOKEN_URL,
  };

  try {
    const response = await axios(authOptions);

    const result = response.data.access_token;

    logger.debug("Access token fetched successfully");

    return result;
  } catch (err) {
    logger.error(`Error fetching access token: ${err.message}`);
  }
}

/**
 * Fetch the details of a Spotify playlist
 *
 * @param {*} param0
 * @returns
 */
export async function fetchPlaylistDetails({ accessToken, spotifyId }) {
  const { type, value } = spotifyId;

  logger.debug(`Fetching ${type} details`);

  const url = `https://api.spotify.com/v1/${type}s/${value}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    logger.debug(`Fetched ${type} details`);

    return {
      ...response.data,
    };
  } catch (err) {
    logger.error(`Error fetching playlist details: ${err.message}`);
    throw err;
  }
}

export async function fetchTracks({ accessToken, spotifyId }) {
  const { type } = spotifyId;

  if (type === "track") {
    return fetchSingleTrack({ accessToken, spotifyId });
  } else {
    return fetchMultipleTracks({ accessToken, spotifyId });
  }
}

/**
 * Fetch the tracks of a Spotify playlist
 *
 * https://developer.spotify.com/documentation/web-api/reference/get-playlists-tracks
 *
 * @param {*} param0
 * @returns
 */
export async function fetchMultipleTracks({ accessToken, spotifyId, url }) {
  const { type, value } = spotifyId;
  const result = [];

  logger.debug(`Fetching ${type} tracks`);

  const tracksUrl = url || `https://api.spotify.com/v1/${type}s/${value}/tracks`;

  const response = await axios.get(tracksUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const next = response.data.next;

  if (next) {
    const nextTracks = await fetchMultipleTracks({
      accessToken,
      spotifyId,
      url: next,
    });
    result.push(...response.data.items.concat(nextTracks));
  } else {
    result.push(...response.data.items);
  }

  if (!url) {
    logger.debug(`Fetched ${result.length} tracks`);
  }

  return result;
}

export async function fetchSingleTrack({ accessToken, spotifyId }) {
  const { value } = spotifyId;

  logger.debug(`Fetching a single track`);

  const url = `https://api.spotify.com/v1/tracks/${value}`;

  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result = response.data;

  logger.debug(`Fetched track`);

  return [result];
}

/**
 * Search for a track on Spotify by query string
 *
 * https://developer.spotify.com/documentation/web-api/reference/search
 *
 * @param {string} query Search query string
 * @param {object} options Options object
 * @param {string} options.accessToken Spotify access token (required)
 * @returns {object|null} { artist: string, title: string } or null if not found
 */
export async function searchTrack(query, options = {}) {
  const { accessToken } = options;

  if (!accessToken) {
    logger.debug("No access token provided for Spotify search");
    return null;
  }

  if (!query || !query.trim()) {
    logger.debug("Empty query provided for Spotify search");
    return null;
  }

  try {
    const url = `${API_BASE_URL}/search`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        q: query.trim(),
        type: "track",
        limit: 1,
      },
    });

    const tracks = response.data?.tracks?.items;

    if (!tracks || tracks.length === 0) {
      logger.debug(`No tracks found for query: ${query}`);
      return null;
    }

    const track = tracks[0];
    const artist = track.artists
      ? track.artists.map((a) => a.name).join(", ")
      : "";
    const title = track.name || "";

    logger.debug(`Found track on Spotify: ${artist} - ${title}`);

    return {
      artist,
      title,
      found: true,
    };
  } catch (err) {
    // Silently fail - return null so we can fallback to current parsing
    logger.debug(`Spotify search failed for query "${query}": ${err.message}`);
    return null;
  }
}
