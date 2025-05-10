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
  const parentFolder = path.join(process.cwd(), DOWNLOADS);

  if (!fs.existsSync(parentFolder)) {
    fs.mkdirSync(parentFolder);
  }

  const folder = path.join(parentFolder, name);

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
}

export function getFileName(filePath) {
  return path.basename(filePath);
}
