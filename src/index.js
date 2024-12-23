import { Command } from "commander";
import { download } from "./download/index.js";
import { saveToFile } from "./store/file.js";

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
		await saveToFile({ playlistUrl });
	});

program
	.command("mp3")
	.description("Downloads a tracklist into mp3 files from YouTube")
	.argument("<playlistUrl>", "the Spotify playlist URL")
	.option("-m, --mock", "do not download the files")
	.option("-a, --album-tag", "set album name in mp3 files, will override default album name")
	.option("-f, --force", "force download of all tracks")
	.action(async (playlistUrl, options) => {
		await download({ playlistUrl, options });
	});

program.parse();
