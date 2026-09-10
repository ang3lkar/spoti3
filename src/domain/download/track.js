import fs from "fs";
import path from "path";
import { logger, callSilently, isPromptCancelled } from "../../utils/logger.js";
import { app, download } from "../../config/index.js";
import { QuotaExceededError } from "../errors.js";
import { searchYouTube } from "../../api/youtube/index.js";
import {
  downloadImageToMemory,
  displayImageInTerminal,
  greekToLatin,
} from "../../utils/basic.js";
import { mp3 } from "../convert/index.js";
import { setTags } from "../tag/index.js";
import { getFileName, sanitizeFilename } from "../../utils/file.js";
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
  return path.join(playlistFolder, `${sanitizeFilename(track.fullTitle)}.mp3`);
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
      title: greekToLatin(track.title),
      artist: greekToLatin(track.artist),
      tagSource: track.tagSource || TAG_SOURCE.YOUTUBE,
    };
  }
  return {
    title: greekToLatin(track.name),
    artist: greekToLatin(track.artists.map((a) => a.name).join(" & ")),
    tagSource: TAG_SOURCE.SPOTIFY,
  };
}

const PROMPT_TIMEOUT_MS = download.DOWNLOAD.PROMPT_TIMEOUT_MS;

async function prompt(message, options) {
  try {
    const result = await logger.prompt(message, options);
    if (isPromptCancelled(result)) {
      process.exit(130);
    }
    return result;
  } catch {
    process.exit(130);
  }
}

// Consola 3.2.3 ignores AbortSignal entirely, so a timeout can't cancel the
// prompt directly. Emitting a synthetic Enter keypress instead submits the
// prompt's current (default) value, which clack's prompt listens for on stdin.
async function promptWithTimeout(message, options, { cancelOnKeypress = false } = {}) {
  if (PROMPT_TIMEOUT_MS <= 0) {
    return prompt(message, options);
  }

  const timer = setTimeout(() => {
    process.stdin.emit("keypress", "\r", { name: "return" });
  }, PROMPT_TIMEOUT_MS);
  const cancelTimer = () => clearTimeout(timer);

  if (cancelOnKeypress) {
    process.stdin.once("keypress", cancelTimer);
  }

  try {
    return await prompt(message, options);
  } finally {
    clearTimeout(timer);
    process.stdin.off("keypress", cancelTimer);
  }
}

export async function promptForTrackMetadata(track, metadata, artBytes, options = {}) {
  let { artist, title } = metadata;
  const { tagSource } = metadata;

  if (
    !isYouTubeTrack(track) ||
    !logger.prompt ||
    typeof logger.prompt !== "function" ||
    options.yolo
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
      const edited = await prompt("Artist", { initial: artist });
      if (edited && edited.trim().length > 0) {
        artist = edited.trim();
      }
      const shouldRemember = await prompt(
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
    { placeholder: "Not sure", initial: title },
    { cancelOnKeypress: true }
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
        const customUrl = await prompt("Thumbnail URL", { initial: "" });
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

/**
 * Derive the final file title from the (possibly user-confirmed) metadata.
 * YouTube tracks use the confirmed artist/title; Spotify tracks keep their
 * ordinal-prefixed fullTitle.
 */
export function getFinalFullTitle(track, confirmed) {
  if (isYouTubeTrack(track)) {
    return `${confirmed.artist} - ${confirmed.title}`;
  }
  return track.fullTitle;
}

async function resolveVideoId(track, playlist) {
  if (isYouTubeTrack(track)) {
    logger.debug(`Using existing video ID: ${track.videoId}`);
    return track.videoId;
  }
  const searchResult = await searchYouTube(getSearchTerm(track, playlist));
  return searchResult?.videoId ?? null;
}

export async function downloadTrack({ playlist, track, tagOptions, downloadOptions }) {
  if (!track) {
    logger.error("Missing track");
    return { outcome: "MISSING_TRACK" };
  }

  const playlistFolder = getPlaylistFolder(playlist);
  const provisionalFilename = getTrackFilePath(playlist, track);

  const artBytes = await downloadArtwork(track, playlist, provisionalFilename);
  const metadata = getTrackMetadata(track);
  const confirmed = await promptForTrackMetadata(
    track,
    metadata,
    artBytes,
    downloadOptions ?? {}
  );

  const finalFullTitle = getFinalFullTitle(track, confirmed);
  const finalFilename = path.join(
    playlistFolder,
    `${sanitizeFilename(finalFullTitle)}.mp3`
  );

  if (!fs.existsSync(finalFilename) || downloadOptions?.force) {
    try {
      const videoId = await resolveVideoId(track, playlist);
      if (!videoId) {
        logger.error(`No video found for ${getSearchTerm(track, playlist)}`);
        return { outcome: "NO_VIDEO_FOUND" };
      }
      mp3(sanitizeFilename(finalFullTitle), videoId, { cwd: playlistFolder });
      logger.debug(`Downloaded ${getFileName(finalFilename)}`);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        throw err;
      }
      logger.error(err);
      return { outcome: "DOWNLOAD_ERROR", error: err };
    }
  }

  const finalTagOptions = {
    ordinal: tagOptions.ordinal,
    title: confirmed.title,
    album: greekToLatin(tagOptions.album || track.album?.name || playlist.name),
    artist: confirmed.artist,
    artBytes: confirmed.artBytes,
  };
  callSilently(setTags, finalFilename, finalTagOptions);

  return { outcome: "SUCCESS", mp3File: finalFilename };
}
