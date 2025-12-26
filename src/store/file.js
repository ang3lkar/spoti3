import fs from "fs";
import path from "path";
import { titleToFriendlyName } from "../utils/basic.js";
import { app } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { getRepoRoot } from "../utils/repo.js";

const { PLAYLISTS } = app.FOLDERS;

export function getPlaylistFileName(playlist) {
  return path.join(
    getRepoRoot(),
    PLAYLISTS,
    `${titleToFriendlyName(playlist)}.txt`
  );
}

function saveToTextFileSync(data, filename) {
  fs.writeFileSync(
    filename,
    data.map((t) => `${t.id}: ${t.fullTitle}`).join("\n")
  );
  logger.info(`Playlist tracks saved to ${filename}`);
}

/**
 * Extracts playlist content from Spotify and saves it to a text file.
 *
 * @param {*} playlist The Spotify playlist object
 * @param {Object} force Whether to ignore all progress and start from the beginning
 * @returns {Promise<string>} The filename where the playlist was saved
 */
export async function saveToFile({ playlist, options }) {
  try {
    const filename = getPlaylistFileName(playlist);

    if (!options.force && fs.existsSync(filename)) {
      logger.info(`File ${filename} already exists. Skipping save.`);
      return { filename };
    }

    if (options.force) {
      logger.info("Force option enabled. Overwriting existing file.");
      fs.rmSync(filename, { force: true });
    }

    const playlistsFolder = path.join(getRepoRoot(), PLAYLISTS);
    if (!fs.existsSync(playlistsFolder)) {
      fs.mkdirSync(playlistsFolder);
    }

    saveToTextFileSync(playlist.tracks, filename);

    return { filename };
  } catch (error) {
    logger.error("Error:", error.message);
    throw error;
  }
}
