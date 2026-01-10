import axios from "axios";
import { logger } from "../../utils/logger.js";
import { api } from "../../config/index.js";
import {
  getCachePath,
  readCache,
  writeCache,
  getSpotifySearchCachePath,
} from "../../utils/cache.js";

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
export async function fetchPlaylistDetails({
  accessToken,
  spotifyId,
  options = {},
}) {
  const { type, value } = spotifyId;

  logger.debug(`Fetching ${type} details`);

  // Check cache first (skip in test environment)
  const disableCache = process.env.NODE_ENV === "test" || options.disableCache;
  if (!disableCache) {
    const cachePath = getCachePath(spotifyId, "details");
    const cached = readCache(cachePath);
    if (cached) {
      logger.debug(`Using cached details for ${type} ${value}`);
      return cached;
    }
  }

  const url = `https://api.spotify.com/v1/${type}s/${value}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    logger.debug(`Fetched ${type} details`);

    const result = {
      ...response.data,
    };

    // Write to cache (skip in test environment)
    if (!disableCache) {
      const cachePath = getCachePath(spotifyId, "details");
      writeCache(cachePath, result);
    }

    return result;
  } catch (err) {
    logger.error(`Error fetching playlist details: ${err.message}`);
    throw err;
  }
}

export async function fetchTracks({ accessToken, spotifyId, options = {} }) {
  const { type, value } = spotifyId;

  // Check cache first (skip in test environment)
  const disableCache = process.env.NODE_ENV === "test" || options.disableCache;
  if (!disableCache) {
    const cachePath = getCachePath(spotifyId, "tracks");
    const cached = readCache(cachePath);
    if (cached) {
      logger.debug(`Using cached tracks for ${type} ${value}`);
      return cached;
    }
  }

  let result;
  if (type === "track") {
    result = await fetchSingleTrack({ accessToken, spotifyId });
  } else {
    result = await fetchMultipleTracks({ accessToken, spotifyId });
  }

  // Write to cache (skip in test environment)
  if (!disableCache) {
    const cachePath = getCachePath(spotifyId, "tracks");
    writeCache(cachePath, result);
  }

  return result;
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

  const tracksUrl =
    url || `https://api.spotify.com/v1/${type}s/${value}/tracks`;

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
 * @param {boolean} options.disableCache Disable cache (default: false)
 * @returns {object|null} { artist: string, title: string, thumbnails: Array } or null if not found
 */
export async function searchTrack(query, options = {}) {
  const { accessToken, disableCache: optDisableCache } = options;

  if (!accessToken) {
    logger.debug("No access token provided for Spotify search");
    return null;
  }

  if (!query || !query.trim()) {
    logger.debug("Empty query provided for Spotify search");
    return null;
  }

  const normalizedQuery = query.trim();

  // Check cache first (skip in test environment)
  const disableCache = process.env.NODE_ENV === "test" || optDisableCache;
  if (!disableCache) {
    const cachePath = getSpotifySearchCachePath(normalizedQuery);
    const cached = readCache(cachePath);
    if (cached) {
      logger.debug(
        `Using cached Spotify search result for: ${normalizedQuery}`
      );
      return cached;
    }
  }

  try {
    const url = `${API_BASE_URL}/search`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        q: normalizedQuery,
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
    const thumbnails = track.album?.images || [];

    logger.debug(`Found track on Spotify: ${artist} - ${title}`);

    const result = {
      artist,
      title,
      thumbnails,
      found: true,
    };

    // Write to cache (skip in test environment)
    if (!disableCache) {
      const cachePath = getSpotifySearchCachePath(normalizedQuery);
      writeCache(cachePath, result);
    }

    return result;
  } catch (err) {
    // Silently fail - return null so we can fallback to current parsing
    logger.debug(`Spotify search failed for query "${query}": ${err.message}`);
    return null;
  }
}
