import fs from "fs";
import path from "path";
import { logger, callSilently } from "../../utils/logger.js";
import { app } from "../../config/index.js";
import { QuotaExceededError } from "../errors.js";
import { searchYouTube } from "../../api/youtube/index.js";
import { downloadImageToMemory } from "../../utils/basic.js";
import { mp3 } from "../convert/index.js";
import { delay } from "../../utils/basic.js";
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

/**
 * Downloads the artwork for a track
 *
 * @param {*} track
 * @param {*} playlist
 * @param {*} playlistFolder
 * @param {*} trackFilename
 * @param {*} options
 */
async function downloadArtwork(
  track,
  playlist,
  playlistFolder,
  trackFilename,
  options = {}
) {
  const { logger: log = logger } = options;
  let artBytes;
  try {
    log.debug(`Downloading image for ${getFileName(trackFilename)}...`);

    let imageUrl;

    // Check if this is a YouTube track or Spotify track
    if (track.videoId) {
      // YouTube track
      imageUrl = getYouTubeTrackImageUrl(track, playlist);
    } else {
      // Spotify track
      imageUrl = getTrackImageUrl(track, playlist);
    }

    if (!imageUrl) {
      log.debug(`No image URL available for ${getFileName(trackFilename)}`);
      return null;
    }

    const artBuffer = await downloadImageToMemory(imageUrl);
    artBytes = new Uint8Array(artBuffer);
  } catch (err) {
    log.error(`Failed to download image for ${getFileName(trackFilename)}`);
    log.error(err.message);
  }
  return artBytes;
}

export async function downloadTrack({ playlist, track, downloadOptions }) {
  const { logger: log = logger } = downloadOptions || {};

  if (!track) {
    log.error("Missing track");
    return { outcome: "MISSING_TRACK" };
  }

  const playlistFolder = path.join(downloadsDir, playlist.folderName);

  const trackFilename = `${playlistFolder}/${track.fullTitle}.mp3`;

  const isDownloaded = fs.existsSync(trackFilename);

  if (isDownloaded && !downloadOptions?.force) {
    return { outcome: "SUCCESS", mp3File: trackFilename };
  }

  try {
    let videoId;

    // Check if this is a YouTube track (has videoId) or Spotify track (needs search)
    if (track.videoId) {
      // YouTube track - use existing video ID
      videoId = track.videoId;
      log.debug(`Using existing video ID: ${videoId}`);
    } else {
      // Spotify track - search YouTube
      const searchResult = await searchYouTube(getSearchTerm(track, playlist), {
        logger: log,
      });

      if (!searchResult) {
        log.error(`No video found for ${getSearchTerm(track, playlist)}`);
        return { outcome: "NO_VIDEO_FOUND" };
      }

      videoId = searchResult.videoId;
    }

    process.chdir(playlistFolder);

    log.debug(`Downloading ${getFileName(trackFilename)}...`);

    if (process.env.MOCK_DOWNLOAD === "yes" || downloadOptions?.mock) {
      await delay(300);
      log.debug(`Mocked download of ${getFileName(trackFilename)}`);
      return { outcome: "SUCCESS", mp3File: trackFilename };
    }

    mp3(track.fullTitle, videoId, { logger: log });

    log.debug(`Downloaded ${getFileName(trackFilename)}`);
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      throw err;
    }

    log.error(err);
    return { outcome: "DOWNLOAD_ERROR", error: err };
  }

  const artBytes = await downloadArtwork(
    track,
    playlist,
    playlistFolder,
    trackFilename,
    { logger: log }
  );

  return { outcome: "SUCCESS", mp3File: trackFilename, artBytes };
}

/**
 * Saves track tags to the downloaded MP3 file
 *
 * @param {*} track
 * @param {*} playlist
 * @param {*} tagOptions
 * @param {*} artBytes
 * @param {*} options
 */
export function saveTrackTags(
  track,
  playlist,
  tagOptions,
  artBytes,
  options = {}
) {
  const { logger: log = logger } = options;
  const playlistFolder = path.join(downloadsDir, playlist.folderName);
  const trackFilename = `${playlistFolder}/${track.fullTitle}.mp3`;

  try {
    // Handle different track structures for Spotify vs YouTube
    let title, artist;

    if (track.videoId) {
      // YouTube track
      title = track.title;
      artist = track.artist;
    } else {
      // Spotify track
      title = track.name;
      artist = track.artists.map((a) => a.name).join(" & ");
    }

    const finalTagOptions = {
      ordinal: tagOptions.ordinal,
      title: title,
      album: tagOptions.album || track.album?.name || playlist.name,
      artist: artist,
      artBytes,
    };

    callSilently(setTags, trackFilename, finalTagOptions, { logger: log });
  } catch (err) {
    log.error(err.message);
  }
}
