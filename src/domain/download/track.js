import fs from "fs";
import path from "path";
import { logger, callSilently } from "../../utils/logger.js";
import { app } from "../../config/index.js";
import { QuotaExceededError } from "../errors.js";
import { searchYouTube } from "../../api/youtube/index.js";
import {
  downloadImageToMemory,
  displayImageInTerminal,
} from "../../utils/basic.js";
import { mp3 } from "../convert/index.js";
import { setTags } from "../tag/index.js";
import { getFileName } from "../../utils/file.js";
import {
  getTrackImageUrl,
  getSearchTerm,
} from "../../services/spotify/utils.js";
import { getYouTubeTrackImageUrl } from "../../services/youtube/utils.js";
import { getRepoRoot } from "../../utils/repo.js";
import { cropToSquare } from "../../utils/image.js";

const { DOWNLOADS } = app.FOLDERS;

const downloadsDir = path.join(getRepoRoot(), DOWNLOADS);

// Constants
const TAG_SOURCE = {
  YOUTUBE: "youtube",
  SPOTIFY: "spotify",
};

export const remembered = { artist: null, thumbnail: null, thumbnailBytes: null };

// Helpers

/**
 * Check if the track is from YouTube (has videoId)
 */
function isYouTubeTrack(track) {
  return Boolean(track?.videoId);
}

/**
 * Get the full file path for a track
 */
function getTrackFilePath(playlist, track) {
  const playlistFolder = path.join(downloadsDir, playlist.folderName);
  return `${playlistFolder}/${track.fullTitle}.mp3`;
}

/**
 * Get the playlist folder path
 */
function getPlaylistFolder(playlist) {
  return path.join(downloadsDir, playlist.folderName);
}

/**
 * Extract title, artist and tag source from a track (handles both YouTube and Spotify)
 */
function getTrackMetadata(track) {
  if (isYouTubeTrack(track)) {
    return {
      title: track.title,
      artist: track.artist,
      tagSource: track.tagSource || TAG_SOURCE.YOUTUBE,
    };
  }
  return {
    title: track.name,
    artist: track.artists.map((a) => a.name).join(" & "),
    tagSource: TAG_SOURCE.SPOTIFY,
  };
}

const PROMPT_TIMEOUT_MS = 5000;

function getDefaultValue(options) {
  if (options.type === "select") {
    const first = options.options?.[0];
    return typeof first === "string" ? first : first?.value;
  }
  return options.initial ?? null;
}

async function promptWithTimeout(message, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROMPT_TIMEOUT_MS);
  try {
    const result = await logger.prompt(message, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    if (controller.signal.aborted) {
      return getDefaultValue(options);
    }
    process.exit(130);
  }
}

async function promptForTrackMetadata(track, metadata, artBytes) {
  let { artist, title } = metadata;
  const { tagSource } = metadata;

  if (
    !isYouTubeTrack(track) ||
    !logger.prompt ||
    typeof logger.prompt !== "function"
  ) {
    return { artist, title, artBytes };
  }

  // Artist — skip prompt if already remembered from a previous track
  if (remembered.artist !== null) {
    artist = remembered.artist;
  } else {
    const choice = await promptWithTimeout(
      `Artist (source: ${tagSource}): "${artist}"`,
      {
        type: "select",
        options: [
          { label: "Accept", value: "accept" },
          { label: "Accept and remember for next tracks", value: "remember" },
          { label: "Edit...", value: "edit" },
        ],
      }
    );

    if (choice === "remember") {
      remembered.artist = artist;
    } else if (choice === "edit") {
      const edited = await promptWithTimeout("Artist", { initial: artist });
      if (edited && edited.trim().length > 0) {
        artist = edited.trim();
      }
      const shouldRemember = await promptWithTimeout(
        `Remember "${artist}" for next tracks?`,
        { type: "confirm", initial: false }
      );
      if (shouldRemember) {
        remembered.artist = artist;
      }
    }
  }

  // Title
  const confirmedTitle = await promptWithTimeout(
    `Title (source: ${tagSource})`,
    { placeholder: "Not sure", initial: title }
  );
  if (confirmedTitle && confirmedTitle.trim().length > 0) {
    title = confirmedTitle.trim();
  }

  // Thumbnail
  if (artBytes && artBytes.length > 0) {
    if (remembered.thumbnailBytes !== null) {
      artBytes = remembered.thumbnailBytes;
    } else if (remembered.thumbnail !== null) {
      if (!remembered.thumbnail) {
        artBytes = null;
      }
    } else {
      logger.newLine();
      const imageDisplayed = displayImageInTerminal(artBytes);
      if (!imageDisplayed) {
        logger.info("Thumbnail preview not available (use iTerm2/Kitty/WezTerm)");
      }
      const thumbnailPromptText = track.thumbnails
        ? `Thumbnail (source: ${tagSource})`
        : null;
      const choice = await promptWithTimeout(thumbnailPromptText, {
        type: "select",
        options: [
          { label: "Accept", value: "accept" },
          { label: "Accept and remember for next tracks", value: "accept-remember" },
          { label: "Skip", value: "skip" },
          { label: "Skip and remember for next tracks", value: "skip-remember" },
          { label: "Custom URL...", value: "custom" },
        ],
      });

      if (choice === "skip" || choice === "skip-remember") {
        artBytes = null;
        logger.info("Thumbnail skipped");
      } else if (choice === "custom") {
        const customUrl = await promptWithTimeout("Thumbnail URL", { initial: "" });
        if (customUrl && customUrl.trim().length > 0) {
          try {
            const buffer = await downloadImageToMemory(customUrl.trim());
            artBytes = new Uint8Array(buffer);
            const customChoice = await promptWithTimeout("Use this thumbnail?", {
              type: "select",
              options: [
                { label: "Accept", value: "accept" },
                { label: "Accept and remember for next tracks", value: "remember" },
              ],
            });
            if (customChoice === "remember") {
              remembered.thumbnailBytes = artBytes;
            }
          } catch (err) {
            logger.error(`Failed to download thumbnail: ${err.message}`);
            artBytes = null;
          }
        }
      }

      if (choice === "accept-remember") {
        remembered.thumbnail = true;
      } else if (choice === "skip-remember") {
        remembered.thumbnail = false;
      }
    }
  }

  return { artist, title, artBytes };
}

/**
 * Downloads the artwork for a track
 */
async function downloadArtwork(track, playlist, trackFilename) {
  try {
    logger.debug(`Downloading image for ${getFileName(trackFilename)}...`);

    const imageUrl = isYouTubeTrack(track)
      ? getYouTubeTrackImageUrl(track, playlist)
      : getTrackImageUrl(track, playlist);

    if (!imageUrl) {
      logger.debug(`No image URL available for ${getFileName(trackFilename)}`);
      return null;
    }

    const artBuffer = await downloadImageToMemory(imageUrl);
    const cropped = isYouTubeTrack(track)
      ? await cropToSquare(artBuffer)
      : artBuffer;
    return new Uint8Array(cropped);
  } catch (err) {
    logger.error(`Failed to download image for ${getFileName(trackFilename)}`);
    logger.error(err.message);
    return null;
  }
}

export async function downloadTrack({ playlist, track, downloadOptions }) {
  if (!track) {
    logger.error("Missing track");
    return { outcome: "MISSING_TRACK" };
  }

  const playlistFolder = getPlaylistFolder(playlist);
  const trackFilename = getTrackFilePath(playlist, track);
  const isDownloaded = fs.existsSync(trackFilename);

  if (isDownloaded && !downloadOptions?.force) {
    const artBytes = await downloadArtwork(track, playlist, trackFilename);
    return { outcome: "SUCCESS", mp3File: trackFilename, artBytes };
  }

  try {
    let videoId;

    if (isYouTubeTrack(track)) {
      videoId = track.videoId;
      logger.debug(`Using existing video ID: ${videoId}`);
    } else {
      const searchResult = await searchYouTube(getSearchTerm(track, playlist));
      if (!searchResult) {
        logger.error(`No video found for ${getSearchTerm(track, playlist)}`);
        return { outcome: "NO_VIDEO_FOUND" };
      }
      videoId = searchResult.videoId;
    }

    mp3(track.fullTitle, videoId, { cwd: playlistFolder });

    logger.debug(`Downloaded ${getFileName(trackFilename)}`);
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      throw err;
    }
    logger.error(err);
    return { outcome: "DOWNLOAD_ERROR", error: err };
  }

  const artBytes = await downloadArtwork(track, playlist, trackFilename);
  return { outcome: "SUCCESS", mp3File: trackFilename, artBytes };
}

/**
 * Saves track tags to the downloaded MP3 file
 */
export async function saveTrackTags(track, playlist, tagOptions, artBytes) {
  let trackFilename = getTrackFilePath(playlist, track);

  try {
    const metadata = getTrackMetadata(track);
    const confirmed = await promptForTrackMetadata(track, metadata, artBytes);

    if (isYouTubeTrack(track)) {
      const confirmedFullTitle = `${confirmed.artist} - ${confirmed.title}`;
      if (confirmedFullTitle !== track.fullTitle) {
        const newFilename = path.join(
          path.dirname(trackFilename),
          `${confirmedFullTitle}.mp3`
        );
        fs.renameSync(trackFilename, newFilename);
        trackFilename = newFilename;
      }
    }

    const finalTagOptions = {
      ordinal: tagOptions.ordinal,
      title: confirmed.title,
      album: tagOptions.album || track.album?.name || playlist.name,
      artist: confirmed.artist,
      artBytes: confirmed.artBytes,
    };

    callSilently(setTags, trackFilename, finalTagOptions);
  } catch (err) {
    logger.error(err.message);
  }
}
