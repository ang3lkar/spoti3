import { logger } from "../../utils/logger.js";
import { downloadTrackList } from "./playlist.js";

import { fetchPlaylist } from "../../services/spotify.js";
import { createDownloadFolder } from "../../utils/file.js";

const validateUrl = (url) => {
  if (url.includes("spotify.com")) {
    return { value: url, source: "spotify" };
  }

  throw new Error("Invalid URL");
};

export async function download({ url, options }) {
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
