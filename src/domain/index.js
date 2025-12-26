import { logger } from "../utils/logger.js";
import { downloadTrackList } from "./download/playlist.js";

import { fetchPlaylist } from "../services/index.js";
import { createDownloadFolder } from "../utils/file.js";
import { validateUrl } from "../utils/validation.js";

export async function run({ url, options = {} }) {
  const { logger: log = logger } = options;
  try {
    const { value, source } = validateUrl(url);

    const playlist = await fetchPlaylist(value, {
      source,
      options: {
        ...options,
        logger: log,
      },
    });
    const album = options.album || playlist.name;

    createDownloadFolder(playlist.folderName);

    await downloadTrackList({
      playlist,
      tracks: playlist.tracks,
      album,
      options: {
        ...options,
        logger: log,
      },
    });
  } catch (err) {
    log.error(err.stack || err.message || err);
    throw err;
  }
}
