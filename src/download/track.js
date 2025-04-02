import { logger } from "../utils/logger.js";
import { DOWNLOADS_FOLDER, checkMark } from "../constants.js";
import { QuotaExceededError } from "../errors.js";
import { searchYouTube } from "../gateway/youtube.js";
import fs from "fs";
import path from "path";
import { mp3 } from "../convert/index.js";
import { delay } from "../utils/basic.js";
import { setTags } from "../tag/index.js";
import { downloadImage } from "../utils/http.js";

const downloadsDir = path.join(process.cwd(), DOWNLOADS_FOLDER);

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

    logger.debug(`Downloading ${trackFilename}...`);

    mp3(track.fullTitle, videoId);
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      throw err;
    }

    logger.error(err);
    return { outcome: "DOWNLOAD_ERROR", error: err };
  }

  let artBytes;
  try {
    logger.debug(`Downloading image for ${trackFilename}...`);
    const imageUrl = track.album
      ? track.album.images[0].url
      : playlist.images[0].url;
    const imageId = imageUrl.split("/").pop();
    const artworkPath = `${playlistFolder}/${imageId}.jpg`;
    await downloadImage(imageUrl, artworkPath);
    logger.debug(`${checkMark} Downloaded image for ${trackFilename}`);

    const artBuffer = fs.readFileSync(artworkPath);
    artBytes = new Uint8Array(artBuffer);
  } catch (err) {
    logger.error(`Failed to download image for ${trackFilename}`);
    logger.error(err.message);
  }

  try {
    tagOptions = {
      ordinal: tagOptions.ordinal,
      title: track.name,
      album: tagOptions.album || track.album?.name || playlist.name,
      artist: track.artists.map((a) => a.name).join("& "),
      artBytes,
    };

    setTags(trackFilename, tagOptions);
  } catch (err) {
    logger.error(err.message);
  }

  return { outcome: "SUCCESS", mp3File: trackFilename };
}
