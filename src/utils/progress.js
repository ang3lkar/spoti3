import fs from "fs";
import { getTmpFilePath, File } from "./file.js";
import { consola } from "consola";

class FileProgress {
	constructor({ playlistFilePath }) {
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
	constructor({playlistFilePath}) {
		this.fileProgress = new FileProgress({playlistFilePath})
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
