import { logger } from "../../utils/logger.js";
import * as MetadataFilter from "metadata-filter";
import getArtistTitle from "get-artist-title";

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

  // also check short-url form
  if (parsedUrl.host.includes("youtu.be")) {
    const value = parsedUrl.pathname.split("/")[1];
    logger.debug(`Extracted YouTube video ID: ${value}`);
    return { type: "video", value: parsedUrl.pathname.split("/")[1] };
  }

  if (list) {
    logger.debug(`Extracted YouTube playlist ID: ${list}`);
    return { type: "playlist", value: list };
  }

  if (v) {
    logger.debug(`Extracted YouTube video ID: ${v}`);
    return { type: "video", value: v };
  }

  if (channel) {
    logger.debug(`Extracted YouTube channel ID: ${channel}`);
    return { type: "channel", value: channel };
  }

  if (Object.keys(result).length === 0) {
    throw new Error("Invalid YouTube URL");
  }
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
 * such as fullTitle.
 *
 * @param {object} item YouTube playlist item
 * @returns {object} Enriched track object
 */
export function enrichYouTubeTrack(item) {
  const { snippet } = item;
  const rawTitle = snippet.title;

  const channelName = getChannelName(item);

  const [rawArtist, _] = rawTitle.includes(" - ")
    ? rawTitle.split(" - ")
    : [null, rawTitle];

  const cleanTitle = MetadataFilter.youtube(rawTitle);
  const [artist0, title] = getArtistTitle(cleanTitle, {
    defaultArtist: rawArtist || channelName,
  });

  const artist = artist0.includes("Topic")
    ? artist0.replace(" - Topic", "").trim()
    : artist0;

  const fullTitle = artist ? `${artist} - ${title}` : title;

  return {
    ...item,
    fullTitle,
    artist,
    title,
    channelTitle: channelName,
    videoId: item.id,
    publishedAt: snippet.publishedAt,
    thumbnails: snippet.thumbnails,
  };
}
