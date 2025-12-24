import { logger } from "../../utils/logger.js";
import { downloadTrack } from "./track.js";
import { QuotaExceededError } from "../errors.js";

export async function downloadTrackList({ playlist, tracks, options = {} }) {
  const { logger: log = logger } = options;
  let count = 0;
  let currentTrack;

  const total = tracks.length;

  log.newLine();
  log.start(`Downloading ${total} tracks from "${playlist.folderName}"...`);

  const succeededTracks = [];
  const failedTracks = [];
  const pendingTracks = [...tracks];

  // Handle Ctrl+C (SIGINT)
  process.on("SIGINT", () => {
    log.info("\nCaught interrupt signal (Ctrl+C), cleaning up...");

    // bring current track back to pending to download next time
    pendingTracks.push(currentTrack);

    // After cleanup, exit the process
    process.exit();
  });

  for (const track of tracks) {
    if (track === undefined) {
      log.info("Track is undefined");
      continue;
    }

    count += 1;
    currentTrack = track;
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
        tagOptions,
        downloadOptions,
      });

      const index = pendingTracks.indexOf(track);

      pendingTracks.splice(index, 1);

      if (result.outcome === "SUCCESS") {
        succeededTracks.push(track);
        log.info(`Downloaded ${track.fullTitle}`);
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
