import fs from "fs";
import path from "path";
import { logger, callSilently } from "../../utils/logger.js";
import { app } from "../../config/index.js";
import { QuotaExceededError } from "../errors.js";
import { searchYouTube } from "../../api/youtube/youtube.js";
import { downloadImageToMemory } from "../../utils/basic.js";
import { mp3 } from "../convert/index.js";
import { delay } from "../../utils/basic.js";
import { setTags } from "../tag/index.js";
import { getFileName } from "../../utils/file.js";
import { getTrackImageUrl, getSearchTerm } from "../../utils/spotify.js";
import {
  getYouTubeSearchTerm,
  getYouTubeTrackImageUrl,
} from "../../utils/youtube.js";

const { DOWNLOADS } = app.FOLDERS;

const downloadsDir = path.join(process.cwd(), DOWNLOADS);

/**
 * Downloads the artwork for a track
 *
 * @param {*} track
 * @param {*} playlist
 * @param {*} playlistFolder
 */
async function downloadArtwork(track, playlist, playlistFolder, trackFilename) {
  let artBytes;
  try {
    logger.debug(`Downloading image for ${getFileName(trackFilename)}...`);

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
      logger.debug(`No image URL available for ${getFileName(trackFilename)}`);
      return null;
    }

    const artBuffer = await downloadImageToMemory(imageUrl);
    artBytes = new Uint8Array(artBuffer);
  } catch (err) {
    logger.error(`Failed to download image for ${getFileName(trackFilename)}`);
    logger.error(err.message);
  }
  return artBytes;
}

export async function downloadTrack({
  playlist,
  track,
  tagOptions,
  downloadOptions,
}) {
  if (!track) {
    logger.error("Missing track");
    return { outcome: "MISSING_TRACK" };
  }

  if (downloadOptions.mock) {
    await delay(300);
    return { outcome: "SUCCESS" };
  }

  let isDownloaded;
  const playlistFolder = path.join(downloadsDir, playlist.folderName);

  const trackFilename = `${playlistFolder}/${track.fullTitle}.mp3`;

  isDownloaded = fs.existsSync(trackFilename);

  if (isDownloaded && !downloadOptions.force) {
    return { outcome: "SUCCESS", mp3File: trackFilename };
  }

  try {
    let videoId;

    // Check if this is a YouTube track (has videoId) or Spotify track (needs search)
    if (track.videoId) {
      // YouTube track - use existing video ID
      videoId = track.videoId;
      logger.debug(`Using existing video ID: ${videoId}`);
    } else {
      // Spotify track - search YouTube
      const searchResult = await searchYouTube(getSearchTerm(track, playlist));

      if (!searchResult) {
        logger.error(`No video found for ${getSearchTerm(track, playlist)}`);
        return { outcome: "NO_VIDEO_FOUND" };
      }

      videoId = searchResult.videoId;
    }

    process.chdir(playlistFolder);

    logger.debug(`Downloading ${getFileName(trackFilename)}...`);

    mp3(track.fullTitle, videoId);

    logger.debug(`Downloaded ${getFileName(trackFilename)}`);
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      throw err;
    }

    logger.error(err);
    return { outcome: "DOWNLOAD_ERROR", error: err };
  }

  const artBytes = await downloadArtwork(
    track,
    playlist,
    playlistFolder,
    trackFilename
  );

  try {
    // Handle different track structures for Spotify vs YouTube
    let title, artist;

    if (track.videoId) {
      // YouTube track
      title = track.title;
      artist = track.channelTitle;
    } else {
      // Spotify track
      title = track.name;
      artist = track.artists.map((a) => a.name).join(" & ");
    }

    tagOptions = {
      ordinal: tagOptions.ordinal,
      title: title,
      album: tagOptions.album || track.album?.name || playlist.name,
      artist: artist,
      artBytes,
    };

    callSilently(setTags, trackFilename, tagOptions);
  } catch (err) {
    logger.error(err.message);
  }

  return { outcome: "SUCCESS", mp3File: trackFilename };
}
