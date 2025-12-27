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
  const { logger: log = logger } = options;
  let count = 0;

  const tracks = playlist.tracks;
  const total = tracks.length;

  log.newLine();
  log.start(`Downloading ${total} tracks from "${playlist.folderName}"...`);

  const succeededTracks = [];
  const failedTracks = [];
  const pendingTracks = [...tracks];

  for (const track of tracks) {
    log.newLine();

    if (track === undefined) {
      log.info("Track is undefined");
      continue;
    }

    count += 1;
    log.info(`Downloading ${count}/${total} ${track.fullTitle}"`);

    const tagOptions = {
      title: track.fullTitle,
      ordinal: count,
      album: options.album,
    };

    const downloadOptions = {
      ...options,
      logger: log,
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
        log.info(`Downloaded ${track.fullTitle}`);

        // Save track tags after successful download
        saveTrackTags(track, playlist, tagOptions, result.artBytes, {
          logger: log,
        });
      } else {
        failedTracks.push(track);
        log.info(`Failed to download ${track.fullTitle}`);
      }
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        log.error(
          "Error occurred while searching YouTube: Request failed with status code 403."
        );
        log.error("Youtube daily quota exceeded. Try again tomorrow!");
        process.exit(0);
      }

      log.error(err);
    }
  }

  process.exit();
}
