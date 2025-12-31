import { logger } from "../utils/logger.js";
import { downloadTrackList } from "./download/playlist.js";

import { fetchPlaylist } from "../services/index.js";
import { createDownloadFolder } from "../utils/file.js";
import { validateUrl } from "../utils/validation.js";

export async function run({ url, options = {} }) {
  try {
    const { value, source } = validateUrl(url);

    const playlist = await fetchPlaylist(value, {
      source,
      options: {
        ...options,
      },
    });
    const album = options.album || playlist.name;

    createDownloadFolder(playlist.folderName);

    await downloadTrackList({
      playlist,
      options: {
        ...options,
        album,
      },
    });
  } catch (err) {
    logger.error(err.stack || err.message || err);
    throw err;
  }
}
