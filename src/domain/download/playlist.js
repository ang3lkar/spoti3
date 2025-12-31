import { logger } from "../../utils/logger.js";
import { downloadTrack, saveTrackTags } from "./track.js";
import { QuotaExceededError } from "../errors.js";

// Handle Ctrl+C (SIGINT)
process.on("SIGINT", () => {
  logger.info("\nCaught interrupt signal (Ctrl+C), cleaning up...");

  // After cleanup, exit the process
  process.exit();
});

export async function downloadTrackList({ playlist, options = {} }) {
  let count = 0;

  const tracks = playlist.tracks;
  const total = tracks.length;

  logger.newLine();
  logger.start(`Downloading ${total} tracks (folder="${playlist.folderName}")...`);

  const succeededTracks = [];
  const failedTracks = [];
  const pendingTracks = [...tracks];

  for (const track of tracks) {
    logger.newLine();

    if (track === undefined) {
      logger.info("Track is undefined");
      continue;
    }

    count += 1;
    logger.info(`Downloading ${count}/${total} ${track.fullTitle}"`);

    const tagOptions = {
      title: track.fullTitle,
      ordinal: count,
      album: options.album,
    };

    const downloadOptions = {
      ...options,
    };

    try {
      const result = await downloadTrack({
        playlist,
        track,
        downloadOptions,
      });

      const index = pendingTracks.indexOf(track);

      pendingTracks.splice(index, 1);

      if (result.outcome === "SUCCESS") {
        succeededTracks.push(track);
        logger.info(`Downloaded ${track.fullTitle}`);

        // Save track tags after successful download
        await saveTrackTags(track, playlist, tagOptions, result.artBytes);
      } else {
        failedTracks.push(track);
        logger.info(`Failed to download ${track.fullTitle}`);
      }
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        logger.error(
          "Error occurred while searching YouTube: Request failed with status code 403."
        );
        logger.error("Youtube daily quota exceeded. Try again tomorrow!");
        process.exit(0);
      }

      logger.error(err);
    }
  }

  process.exit();
}
