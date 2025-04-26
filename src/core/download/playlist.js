import { logger } from "../../utils/logger.js";
import { downloadTrack } from "./track.js";
import { lineWithCheckmark, lineWithX } from "../../store/helpers.js";
import { QuotaExceededError } from "../../core/errors.js";

export async function downloadTrackList({ playlist, tracks, options }) {
  let count = 0;
  let currentTrack;

  if (options.mock) {
    logger.warn(
      "Mock mode enabled. In this mode app will not search or download files to avoid reaching Youtube quotas."
    );
  }

  let total = tracks.length;

  logger.start(`Downloading ${total} tracks from "${playlist.folderName}"...`);

  const succeededTracks = [];
  const failedTracks = [];
  const pendingTracks = [...tracks];

  // Handle Ctrl+C (SIGINT)
  process.on("SIGINT", () => {
    logger.info("\nCaught interrupt signal (Ctrl+C), cleaning up...");

    // bring current track back to pending to download next time
    pendingTracks.push(currentTrack);

    // After cleanup, exit the process
    process.exit();
  });

  for (const track of tracks) {
    logger.info("--------------------------------");

    if (track === undefined) {
      logger.info("Track is undefined");
      continue;
    }

    count += 1;
    currentTrack = track;
    logger.info(
      `Downloading ${count}/${total} "${track.id}: ${track.fullTitle}"`
    );

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
        tagOptions,
        downloadOptions,
      });

      const index = pendingTracks.indexOf(track);

      pendingTracks.splice(index, 1);

      if (result.outcome === "SUCCESS") {
        succeededTracks.push(track);
        logger.info(lineWithCheckmark(`${track.id}: ${track.fullTitle}`));
      } else {
        failedTracks.push(track);
        logger.info(lineWithX(`${track.id}: ${track.fullTitle}`));
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
