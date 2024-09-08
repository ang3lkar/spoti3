import fs from "fs";
import path from "path";
import { File } from "./file.js";
import { PLAYLISTS_FOLDER } from "../constants.js";

export class Progress {
	constructor({ playlistFilePath }) {
    this.tmpFilePath = path.join(process.cwd(), PLAYLISTS_FOLDER, "tmp.txt");
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
