import { logger } from "../../utils/logger.js";
import { downloadTrack, saveTrackTags } from "./track.js";
import { QuotaExceededError } from "../errors.js";

const DOWNLOAD_OUTCOME = {
  SUCCESS: "SUCCESS",
};

/**
 * Setup handler for Ctrl+C (SIGINT) interrupts
 */
function setupInterruptHandler() {
  process.on("SIGINT", () => {
    logger.info("\nCaught interrupt signal (Ctrl+C), cleaning up...");
    process.exit();
  });
}

/**
 * Process a single track: download and tag
 */
async function processTrack({ track, playlist, tagOptions, downloadOptions }) {
  const result = await downloadTrack({
    playlist,
    track,
    downloadOptions,
  });

  if (result.outcome === DOWNLOAD_OUTCOME.SUCCESS) {
    logger.info(`Downloaded ${track.fullTitle}`);
    await saveTrackTags(track, playlist, tagOptions, result.artBytes);
    return true;
  }

  logger.info(`Failed to download ${track.fullTitle}`);
  return false;
}

export async function downloadTrackList({ playlist, options = {} }) {
  setupInterruptHandler();

  const { tracks } = playlist;
  const total = tracks.length;

  logger.newLine();
  logger.start(`Downloading ${total} tracks (folder="${playlist.folderName}")...`);

  let count = 0;

  for (const track of tracks) {
    logger.newLine();

    if (!track) {
      logger.info("Track is undefined");
      continue;
    }

    count += 1;
    logger.info(`Downloading ${count}/${total} ${track.fullTitle}`);

    const tagOptions = {
      title: track.fullTitle,
      ordinal: count,
      album: options.album,
    };

    try {
      await processTrack({
        track,
        playlist,
        tagOptions,
        downloadOptions: options,
      });
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        logger.error(
          "Error occurred while searching YouTube: Request failed with status code 403."
        );
        logger.error("Youtube daily quota exceeded. Try again tomorrow!");
        process.exit(1);
      }

      logger.error(err);
    }
  }

  process.exit();
}
