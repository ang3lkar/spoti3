import * as spotifyApi from "../../api/spotify/index.js";
import { logger } from "../../utils/logger.js";
import {
  getSpotifySearchCachePath,
  readCache,
  writeCache,
} from "../../utils/cache.js";

/**
 * Normalize a YouTube title for Spotify search by removing common suffixes
 * and cleaning up the query
 *
 * @param {string} title YouTube video title
 * @returns {string} Normalized query string
 */
function normalizeQuery(title) {
  if (!title) return "";

  // Remove common YouTube suffixes/patterns (case insensitive)
  const patterns = [
    /\s*-\s*live\s*$/i,
    /\s*-\s*live\s*at\s*.+$/i,
    /\s*@\s*.+$/i,
    /\s*\(live\)/gi,
    /\s*\[live\]/gi,
    /\s*\(official\s*video\)/gi,
    /\s*\[official\s*video\]/gi,
    /\s*\(official\s*audio\)/gi,
    /\s*\[official\s*audio\]/gi,
    /\s*\(.*remix.*\)/gi,
    /\s*\[.*remix.*\]/gi,
    /\s*\(.*cover.*\)/gi,
    /\s*\[.*cover.*\]/gi,
    /\s*-\s*.*\d{4}.*$/i, // Remove year suffixes like "- 2000"
  ];

  let normalized = title.trim();

  // Apply all patterns
  for (const pattern of patterns) {
    normalized = normalized.replace(pattern, "");
  }

  // Clean up multiple spaces
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

/**
 * Search for a track on Spotify by YouTube title
 * Uses caching to avoid repeated API calls
 *
 * @param {string} youtubeTitle YouTube video title
 * @param {object} options Options object
 * @param {boolean} options.disableCache Skip cache (for testing)
 * @returns {object|null} { artist: string, title: string, source: 'spotify' } or null
 */
export async function searchTrackByTitle(youtubeTitle, options = {}) {
  const { disableCache = false } = options;

  if (!youtubeTitle || !youtubeTitle.trim()) {
    logger.debug("Empty YouTube title provided for Spotify search");
    return null;
  }

  // Normalize the query
  const normalizedQuery = normalizeQuery(youtubeTitle);
  if (!normalizedQuery) {
    logger.debug("Query became empty after normalization");
    return null;
  }

  // Check cache first (skip in test environment)
  const shouldUseCache = !disableCache && process.env.NODE_ENV !== "test";
  if (shouldUseCache) {
    const cachePath = getSpotifySearchCachePath(normalizedQuery);
    const cached = readCache(cachePath);
    if (cached) {
      logger.debug(`Using cached Spotify search result for: ${normalizedQuery}`);
      return cached;
    }
  }

  // Get access token
  let accessToken;
  try {
    accessToken = await spotifyApi.fetchAccessToken();
    if (!accessToken) {
      logger.debug("Failed to get Spotify access token");
      return null;
    }
  } catch (err) {
    logger.debug(`Error fetching Spotify access token: ${err.message}`);
    return null;
  }

  // Search Spotify
  const result = await spotifyApi.searchTrack(normalizedQuery, {
    accessToken,
  });

  if (!result) {
    return null;
  }

  // Add source indicator
  const enrichedResult = {
    ...result,
    source: "spotify",
  };

  // Cache the result
  if (shouldUseCache) {
    const cachePath = getSpotifySearchCachePath(normalizedQuery);
    writeCache(cachePath, enrichedResult);
  }

  return enrichedResult;
}
