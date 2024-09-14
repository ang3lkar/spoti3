import fs from "fs";
import path from "path";

import { PLAYLISTS_FOLDER } from "../constants.js";

/**
 * A function to get an array of strings from a file
 *
 * @param {*} filePath The path to the file to read
 * @returns An array of strings representing the lines in the file
 */
export function getArrayFromFile(filePath) {
	return fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
}

export function getTmpFilePath() {
	return path.join(process.cwd(), PLAYLISTS_FOLDER, "tmp.txt");
}

export class File {
	constructor(fileName) {
		this.fileName = fileName;
	}

	clear() {
		fs.writeFileSync(this.fileName, "");
	}

	append(line) {
		fs.writeFileSync(this.fileName, line, { flag: "a" });
	}
}
