import { Command } from 'commander';
import { downloadTrackList } from "./download/index.js";

const program = new Command();

program
  .name('src/index.js')
  .description('CLI to download music from YouTube')
  .version('0.0.0');

program.command('mp3')
  .description('Downloads a tracklist into mp3 files from YouTube')
  .argument('<playlist>', 'the playlist file')
  .option('-m, --mock', 'do not download the files, just print the commands')
  .action(async (playlist, options) => {
    await downloadTrackList({playlist, options});
  });

program.parse();
