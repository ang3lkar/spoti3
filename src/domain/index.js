import { logger } from "../utils/logger.js";
import { downloadTrackList } from "./download/playlist.js";

import { fetchPlaylist } from "../services/index.js";
import { createDownloadFolder } from "../utils/file.js";

/**
 * Validates the URL and returns the source and value
 * @param {*} url
 * @returns {object} { value: url, source: "spotify" | "youtube" }
 */
const validateUrl = (url) => {
  if (url.includes("spotify.com")) {
    return { value: url, source: "spotify" };
  } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return { value: url, source: "youtube" };
  }

  throw new Error("Invalid URL - must be a Spotify or YouTube URL");
};

export async function run({ url, options }) {
  try {
    const { value, source } = validateUrl(url);

    const playlist = await fetchPlaylist(value, { source });
    const album = options.album || playlist.name;

    createDownloadFolder(playlist.folderName);

    await downloadTrackList({
      playlist,
      tracks: playlist.tracks,
      album,
      options,
    });
  } catch (err) {
    logger.error(err.stack);
  }
}
