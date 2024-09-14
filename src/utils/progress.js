import fs from "fs";
import { getTmpFilePath, File } from "./file.js";

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
    console.log(line);
		this.tmpFile.append(line);
	}

	complete() {
		fs.renameSync(this.tmpFilePath, this.playlistPath);
	}
}
