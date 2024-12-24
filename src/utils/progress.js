import fs from "fs";
import { getTmpFilePath, File } from "./file.js";
import { consola } from "consola";
import path from "path";
import { getPlaylistFileName } from "../store/file.js";

class FileProgress {
	constructor(playlist) {
		const playlistFilePath = path.join(process.cwd(), getPlaylistFileName(playlist));
		this.tmpFilePath = getTmpFilePath();
		this.playlistPath = playlistFilePath;
		this.tmpFile = new File(this.tmpFilePath);
	}

	start() {
		this.tmpFile.clear();
	}

	submit(line) {
		this.tmpFile.append(line);
	}

	complete() {
		fs.renameSync(this.tmpFilePath, this.playlistPath);

		const results = fs.readFileSync(this.playlistPath).toString();
		consola.box(results);
	}
}

export class Progress {
	constructor(playlist) {
		this.fileProgress = new FileProgress(playlist);
	}

	start() {
		this.fileProgress.start();
	}

	submit(line) {
		this.fileProgress.submit(line);
	}

	complete() {
		this.fileProgress.complete();
	}
}
