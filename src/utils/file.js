import fs from "fs";
import path from "path";
import { app } from "../config/index.js";

const { DOWNLOADS } = app.FOLDERS;

/**
 * Create a folder with the given name in the playlists folder
 *
 * @param {*} name The name of the folder to create
 */
export function createDownloadFolder(name) {
  const folder = path.join(process.cwd(), DOWNLOADS, name);

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
}

/**
 * A function to get an array of strings from a file
 *
 * @param {*} filePath The path to the file to read
 * @returns An array of strings representing the lines in the file
 */
export function getArrayFromFile(filePath) {
  return fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
}

export function getFileName(filePath) {
  return path.basename(filePath);
}
