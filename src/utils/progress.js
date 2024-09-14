import fs from "fs";
import { getTmpFilePath, File } from "./file.js";
import { consola } from "consola";

export class Progress {
	constructor({ playlistFilePath }) {
    this.tmpFilePath = getTmpFilePath();
    this.playlistPath = playlistFilePath
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
