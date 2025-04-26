import { logger, callSilently } from "../utils/logger.js";
import { DOWNLOADS_FOLDER, checkMark } from "../constants.js";
import { QuotaExceededError } from "../errors.js";
import { searchYouTube } from "../gateway/youtube.js";
import fs from "fs";
import path from "path";
import { mp3 } from "../convert/index.js";
import { delay } from "../utils/basic.js";
import { setTags } from "../tag/index.js";
import { downloadImage } from "../utils/http.js";
import { getFileName } from "../utils/file.js";
const downloadsDir = path.join(process.cwd(), DOWNLOADS_FOLDER);

async function downloadArtwork(track, playlist, playlistFolder, trackFilename) {
  let artBytes;
  try {
    logger.debug(`Downloading image for ${getFileName(trackFilename)}...`);

    const imageUrl = track.album
      ? track.album.images[0].url
      : playlist.images[0].url;
    const imageId = imageUrl.split("/").pop();
    const artworkPath = `${playlistFolder}/${imageId}.jpg`;
    await downloadImage(imageUrl, artworkPath);

    logger.debug(`Downloaded image for ${getFileName(trackFilename)}`);

    const artBuffer = fs.readFileSync(artworkPath);
    artBytes = new Uint8Array(artBuffer);

    // image loaded into memory, delete file
    fs.unlinkSync(artworkPath);
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

  if (isDownloaded) {
    return { outcome: "SUCCESS", mp3File: trackFilename };
  }

  try {
    const searchResult = await searchYouTube(track.fullTitle);

    if (!searchResult) {
      return { outcome: "NO_VIDEO_FOUND" };
    }

    const videoId = searchResult.videoId;

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
    tagOptions = {
      ordinal: tagOptions.ordinal,
      title: track.name,
      album: tagOptions.album || track.album?.name || playlist.name,
      artist: track.artists.map((a) => a.name).join("& "),
      artBytes,
    };

    callSilently(setTags, trackFilename, tagOptions);
  } catch (err) {
    logger.error(err.message);
  }

  return { outcome: "SUCCESS", mp3File: trackFilename };
}
