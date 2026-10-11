import { logger, isPromptCancelled } from "../utils/logger.js";
import { downloadTrackList } from "./download/playlist.js";
import { hintIfStale } from "./convert/staleness.js";

import { fetchPlaylist } from "../services/index.js";
import { createDownloadFolder } from "../utils/file.js";
import { validateUrl } from "../utils/validation.js";

async function confirmFolderName(suggested) {
  if (!logger.prompt || typeof logger.prompt !== "function") {
    return suggested;
  }
  try {
    const confirmed = await logger.prompt("Download folder", { initial: suggested });
    if (isPromptCancelled(confirmed)) {
      process.exit(130);
    }
    return confirmed && confirmed.trim().length > 0 ? confirmed.trim() : suggested;
  } catch {
    process.exit(130);
  }
}

export async function run({ url, options = {} }) {
  try {
    const { value, source } = validateUrl(url);
    hintIfStale("startup");

    const playlist = await fetchPlaylist(value, {
      source,
      options: {
        ...options,
      },
    });
    const album = options.album || playlist.name;

    const folderName = options.yolo
      ? playlist.folderName
      : await confirmFolderName(playlist.folderName);
    createDownloadFolder(folderName);

    await downloadTrackList({
      playlist: { ...playlist, folderName },
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
