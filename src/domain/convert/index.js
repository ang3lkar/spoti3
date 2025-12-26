import { execSync } from "child_process";
import { logger } from "../../utils/logger.js";

// Function to download a track using yt-dlp
export function mp3(filename, videoId, options = {}) {
  const { logger: log = logger } = options;
  try {
    const command = `yt-dlp --ffmpeg-location /opt/homebrew/bin/ffmpeg --extract-audio --audio-format mp3 --audio-quality 0 --no-check-certificate -o "${filename}.mp3" https://www.youtube.com/watch?v=${videoId}`;
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    log.error("Error downloading track:", error.message);
    throw error;
  }
}
