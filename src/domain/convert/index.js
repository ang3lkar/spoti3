import { execSync } from "child_process";
import { logger } from "../../utils/logger.js";

/**
 * Download a track from YouTube as MP3 using yt-dlp
 *
 * @param {string} filename - Output filename (without extension)
 * @param {string} videoId - YouTube video ID
 * @param {object} options - Optional settings
 * @param {string} options.cwd - Working directory for the download
 */
export function mp3(filename, videoId, options = {}) {
  try {
    logger.debug(`Downloading ${filename}...`);

    const command = `yt-dlp --ffmpeg-location /opt/homebrew/bin/ffmpeg --extract-audio --audio-format mp3 --audio-quality 0 --no-check-certificate -o "${filename}.mp3" https://www.youtube.com/watch?v=${videoId}`;
    execSync(command, { stdio: "inherit", cwd: options.cwd });
  } catch (error) {
    logger.error("Error downloading track:", error.message);
    throw error;
  }
}
