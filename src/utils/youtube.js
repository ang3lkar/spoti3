import { logger } from "./logger.js";

/**
 * Extract YouTube playlist ID from a YouTube URL
 *
 * @param {string} url YouTube playlist URL
 * @returns {object} { type: string, value: string }
 */
export function extractYouTubeId(url) {
  logger.debug("Extracting YouTube ID from YouTube URL");

  const parsedUrl = new URL(url);

  // get query params
  const queryParams = parsedUrl.searchParams;
  const list = queryParams.get("list");
  const v = queryParams.get("v");
  const channel = queryParams.get("channel");

  const result = {};

  if (list) {
    logger.debug(`Extracted YouTube playlist ID: ${list}`);
    result["playlist"] = list;
  }

  if (v) {
    logger.debug(`Extracted YouTube video ID: ${v}`);
    result["video"] = v;
  }

  if (channel) {
    logger.debug(`Extracted YouTube channel ID: ${channel}`);
    result["channel"] = channel;
  }

  // also check short-url form
  if (parsedUrl.host.includes("youtu.be")) {
    const value = parsedUrl.pathname.split("/")[1];
    logger.debug(`Extracted YouTube video ID: ${value}`);
    result["video"] = parsedUrl.pathname.split("/")[1];
  }

  if (Object.keys(result).length === 0) {
    throw new Error("Invalid YouTube URL");
  }

  return result;
}

/**
 * Get the search term for a YouTube track
 *
 * @param {object} track YouTube track object
 * @param {object} playlist YouTube playlist object
 * @returns {string} Search term for YouTube search
 */
export function getYouTubeSearchTerm(track, playlist) {
  // For YouTube playlists, we can use the video title directly
  // since it's already a YouTube video
  return track.title || track.snippet?.title || "";
}

/**
 * Get the channel name from a YouTube track
 *
 * @param {object} track YouTube track object
 * @returns {string} Channel name
 */
export function getChannelName(track) {
  return track.snippet?.channelTitle || track.channelTitle || "";
}

/**
 * Get the thumbnail URL for a YouTube track
 *
 * @param {object} track YouTube track object
 * @param {object} playlist YouTube playlist object
 * @returns {string} Thumbnail URL
 */
export function getYouTubeTrackImageUrl(track, playlist) {
  // Try to get the highest quality thumbnail available
  const thumbnails = track.thumbnails || track.snippet?.thumbnails;

  if (thumbnails) {
    // Prefer maxres, then high, then medium, then default
    return (
      thumbnails.maxres?.url ||
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url
    );
  }

  // Fallback to playlist thumbnail if available
  const playlistThumbnails = playlist.thumbnails;
  if (playlistThumbnails) {
    return (
      playlistThumbnails.maxres?.url ||
      playlistThumbnails.high?.url ||
      playlistThumbnails.medium?.url ||
      playlistThumbnails.default?.url
    );
  }

  return null;
}

/**
 * Enrich a YouTube track with additional information
 *
 * @param {object} item YouTube playlist item
 * @returns {object} Enriched track object
 */
export function enrichYouTubeTrack(item) {
  const snippet = item.snippet;

  // Replace / with | to avoid creating folders when creating mp3 files
  const title = snippet.title.replace(/\//g, "|");
  const channelName = getChannelName(item);

  const fullTitle = channelName ? `${channelName} - ${title}` : title;

  return {
    ...item,
    fullTitle,
    title,
    channelTitle: channelName,
    videoId: item.contentDetails?.videoId || item.id?.videoId,
    publishedAt: snippet.publishedAt,
    thumbnails: snippet.thumbnails,
  };
}
