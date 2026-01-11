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

const { DOWNLOADS } = app.FOLDERS;

const downloadsDir = path.join(getRepoRoot(), DOWNLOADS);

// Constants
const TAG_SOURCE = {
  YOUTUBE: "youtube",
  SPOTIFY: "spotify",
};

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

/**
 * Prompt user to confirm/edit track metadata (artist, title, thumbnail)
 * Only prompts for YouTube tracks when logger.prompt is available
 */
async function promptForTrackMetadata(track, metadata, artBytes) {
  let { artist, title } = metadata;
  const { tagSource } = metadata;

  // Only prompt for YouTube tracks when prompt function is available
  if (
    !isYouTubeTrack(track) ||
    !logger.prompt ||
    typeof logger.prompt !== "function"
  ) {
    return { artist, title, artBytes };
  }

  const artistPromptText = `Artist (source: ${tagSource})`;
  const titlePromptText = `Title (source: ${tagSource})`;
  const thumbnailPromptText = track.thumbnails
    ? `Thumbnail (source: ${tagSource})`
    : null;

  const confirmedArtist = await logger.prompt(artistPromptText, {
    placeholder: "Not sure",
    initial: artist,
  });
  if (confirmedArtist && confirmedArtist.trim().length > 0) {
    artist = confirmedArtist.trim();
  }

  const confirmedTitle = await logger.prompt(titlePromptText, {
    placeholder: "Not sure",
    initial: title,
  });
  if (confirmedTitle && confirmedTitle.trim().length > 0) {
    title = confirmedTitle.trim();
  }

  // Preview thumbnail and ask for approval
  if (artBytes && artBytes.length > 0) {
    logger.newLine();
    const imageDisplayed = displayImageInTerminal(artBytes);
    if (!imageDisplayed) {
      logger.info("Thumbnail preview not available (use iTerm2/Kitty/WezTerm)");
    }
    const approvedThumbnail = await logger.prompt(thumbnailPromptText, {
      type: "confirm",
      initial: true,
    });
    if (!approvedThumbnail) {
      artBytes = null;
      logger.info("Thumbnail skipped");
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
    return new Uint8Array(artBuffer);
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
  const trackFilename = getTrackFilePath(playlist, track);

  try {
    const metadata = getTrackMetadata(track);
    const confirmed = await promptForTrackMetadata(track, metadata, artBytes);

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
