import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { searchYouTube } from "./youtube_search.js";
import { QuotaExceededError } from "./errors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to download a track using yt-dlp
function mp3(videoId) {
  try {
    const command = `yt-dlp --prefer-ffmpeg --ffmpeg-location /opt/homebrew/bin/ffmpeg --extract-audio --audio-format mp3 --audio-quality 0 --embed-thumbnail --no-check-certificate https://www.youtube.com/watch?v=${videoId}`;
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error("Error downloading track:", error.message);
  }
}

// Function to search for a track and download it
async function downloadTrack(track) {
  if (!track) {
    console.error("Missing track name");
    return false;
  }

  try {
    const searchResult = await searchYouTube(track);

    if (!searchResult) {
      return "NO_VIDEO_FOUND";
    }

    const videoId = searchResult.videoId;

    console.log(`\nVideo ID: ${videoId}`);

    const downloadsDir = path.join(__dirname, "downloads");

    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir);
    }

    process.chdir(downloadsDir);

    // Call the mp3 function with the video ID
    mp3(videoId);

    return "SUCCESS";
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      throw error;
    }

    console.error("Error during track download:", error.message);
    return "DOWNLOAD_ERROR";
  }
}

// Function to download all tracks from a list in a file
async function downloadList(filePath) {
  const tmpFilePath = path.join(__dirname, "tmp_download_list.txt");

  // Read the file line by line
  const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
  const tmpFile = fs.createWriteStream(tmpFilePath);

  let count = 0;
  let total = lines.length;

  console.log(`Playlist tracks: ${total}`);
  console.log("---");

  for (const line of lines) {
    count += 1;
    console.log(`Downloading ${count}/${total} "${line}"`);

    try {
      const result = await downloadTrack(line);

      if (result === "SUCCESS") {
        console.log(`${result}! ✔️`);
        tmpFile.write(`${line} ✔️\n`);
      } else {
        console.log(`${result}! X`);
        tmpFile.write(`${line} X\n`);
      }
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        console.error("Error occurred while searching YouTube: Request failed with status code 403.")
        console.error("Youtube daily quota exceeded. Exiting...");
      }
      process.exit(1);
    }
    console.log("---");
  }

  tmpFile.end();

  // move to parent folder
  process.chdir(__dirname);

  // Replace the original file with the modified content
  fs.renameSync(tmpFilePath, filePath);

  console.log("fin!");
}

// Run the downloadList function with the provided argument
if (process.argv.length < 3) {
  console.error("Usage: node downloadTracks.js <filename>");
  process.exit(1);
}

const filename = process.argv[2];
await downloadList(filename);
