import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getRepoRoot } from "./repo.js";

const CACHE_DIR = path.join(getRepoRoot(), ".cache");

/**
 * Ensure the cache directory exists
 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Get the cache file path for a YouTube ID
 *
 * @param {object} youtubeId { type: string, value: string }
 * @param {string} suffix Optional suffix to differentiate cache types (e.g., 'details', 'tracks')
 * @returns {string} Cache file path
 */
export function getCachePath(youtubeId, suffix = "") {
  ensureCacheDir();
  const { type, value } = youtubeId;
  const filename = suffix
    ? `${type}_${value}_${suffix}.json`
    : `${type}_${value}.json`;
  return path.join(CACHE_DIR, filename);
}

/**
 * Read data from cache
 *
 * @param {string} cachePath Path to cache file
 * @returns {object|null} Cached data or null if not found
 */
export function readCache(cachePath) {
  try {
    if (fs.existsSync(cachePath)) {
      const data = fs.readFileSync(cachePath, "utf8");
      return JSON.parse(data);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Write data to cache as pretty-formatted JSON
 *
 * @param {string} cachePath Path to cache file
 * @param {*} data Data to cache
 */
export function writeCache(cachePath, data) {
  ensureCacheDir();
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(cachePath, json, "utf8");
}

/**
 * Get the cache file path for a Spotify search query
 *
 * @param {string} normalizedQuery Normalized search query string
 * @returns {string} Cache file path
 */
export function getSpotifySearchCachePath(normalizedQuery) {
  ensureCacheDir();
  // Create a hash of the query for a unique, safe filename
  const hash = crypto
    .createHash("md5")
    .update(normalizedQuery.toLowerCase().trim())
    .digest("hex");
  const filename = `spotify_search_${hash}.json`;
  return path.join(CACHE_DIR, filename);
}
