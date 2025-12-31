import { logger } from "../../utils/logger.js";
import * as MetadataFilter from "metadata-filter";
import getArtistTitle from "get-artist-title";
import { searchTrackByTitle } from "../spotify/search.js";

/**
 * Extract YouTube playlist ID from a YouTube URL
 *
 * @param {string} url YouTube playlist URL
 * @param {object} options Options object
 * @returns {object} { type: string, value: string }
 */
export function extractYouTubeId(url, options = {}) {
  const { logger: log = logger } = options;
  log.debug("Extracting YouTube ID from YouTube URL");

  const parsedUrl = new URL(url);

  // get query params
  const queryParams = parsedUrl.searchParams;
  const list = queryParams.get("list");
  const v = queryParams.get("v");
  const channel = queryParams.get("channel");

  // also check short-url form
  if (parsedUrl.host.includes("youtu.be")) {
    const value = parsedUrl.pathname.split("/")[1];
    log.debug(`Extracted YouTube video ID: ${value}`);
    return { type: "video", value: parsedUrl.pathname.split("/")[1] };
  }

  if (v) {
    log.debug(`Extracted YouTube video ID: ${v}`);
    return { type: "video", value: v };
  }

  if (list) {
    log.debug(`Extracted YouTube playlist ID: ${list}`);
    return { type: "playlist", value: list };
  }

  if (channel) {
    log.debug(`Extracted YouTube channel ID: ${channel}`);
    return { type: "channel", value: channel };
  }

  // Handle channel URLs in path - return null as expected by tests
  if (parsedUrl.pathname.startsWith("/channel/")) {
    return { type: null, value: null };
  }

  // Return null for unsupported URL types
  return { type: null, value: null };
}

/**
 * Get the search term for a YouTube track
 *
 * @param {object} track YouTube track object
 * @param {object} playlist YouTube playlist object
 * @returns {string} Search term for YouTube search
 */
export function getYouTubeSearchTerm(track, _playlist) {
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
 * @param {object} options Options object
 * @param {object} options.logger Logger instance
 * @param {boolean} options.disableCache Skip cache (for testing)
 * @returns {Promise<object>} Enriched track object
 */
export async function enrichYouTubeTrack(item, options = {}) {
  const { logger: log = logger, disableCache = false } = options;
  const { snippet } = item;
  const rawTitle = snippet.title;

  const channelName = getChannelName(item);

  // Try Spotify search first
  let artist, title, tagSource;
  const spotifyResult = await searchTrackByTitle(rawTitle, {
    logger: log,
    disableCache,
  });

  if (spotifyResult && spotifyResult.artist && spotifyResult.title) {
    // Use Spotify result
    artist = spotifyResult.artist;
    title = spotifyResult.title;
    tagSource = "spotify";
    log.debug(`Using Spotify metadata: ${artist} - ${title}`);
  } else {
    // Fallback to current parsing method
    const [rawArtist, _] = rawTitle.includes(" - ")
      ? rawTitle.split(" - ")
      : [null, rawTitle];

    const cleanTitle = MetadataFilter.youtube(rawTitle);
    const [artist0, title0] = getArtistTitle(cleanTitle, {
      defaultArtist: rawArtist || channelName,
    });

    artist = artist0.includes("Topic")
      ? artist0.replace(" - Topic", "").trim()
      : artist0;
    title = title0;
    tagSource = "youtube";
  }

  const fullTitle = artist ? `${artist} - ${title}` : title;

  return {
    ...item,
    fullTitle,
    artist,
    title,
    tagSource,
    channelTitle: channelName,
    videoId: item.contentDetails.videoId || item.id?.videoId,
    publishedAt: snippet.publishedAt,
    thumbnails: snippet.thumbnails,
  };
}
