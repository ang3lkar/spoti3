#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { run } from "../domain/index.js";
import { saveToFile } from "../store/file.js";
import { fetchPlaylist } from "../services/index.js";
import { logger } from "../utils/logger.js";
import { validateUrl } from "../utils/validation.js";

const program = new Command();

program
  .name("spoti3")
  .description("CLI to download music from YouTube")
  .version("0.0.0");

program
  .command("import")
  .description("Imports a playlist from Spotify")
  .argument("<playlist>", "the Spotify playlist URL")
  .action(async (playlistUrl) => {
    try {
      const { value, source } = validateUrl(playlistUrl);

      const playlist = await fetchPlaylist(value, {
        source,
        options: {
          logger,
        },
      });

      await saveToFile({ playlist, options: {} });
    } catch (err) {
      logger.error(err.message || err);
      if (err.stack) {
        logger.error(err.stack);
      }
      process.exit(1);
    }
  });

program
  .command("mp3")
  .description("Downloads a tracklist into mp3 files from YouTube")
  .argument("<url>", "the Spotify playlist/track URL")
  .option(
    "-a, --album-tag",
    "set album name in mp3 files, will override default album name"
  )
  .option("-f, --force", "force download of all tracks")
  .action(async (url, options) => {
    try {
      await run({ url, options });
    } catch (err) {
      logger.error(err.message || err);
      if (err.stack) {
        logger.error(err.stack);
      }
      process.exit(1);
    }
  });

program.parse();
