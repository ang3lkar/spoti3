import fs from "fs";
import path from "path";
import { app } from "../config/index.js";
import { getRepoRoot } from "./repo.js";

const { DOWNLOADS } = app.FOLDERS;

/**
 * Create a folder with the given name in the playlists folder
 *
 * @param {*} name The name of the folder to create
 */
export function createDownloadFolder(name) {
  const repoRoot = getRepoRoot();
  const parentFolder = path.join(repoRoot, DOWNLOADS);

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

/**
 * Replace characters that the filesystem treats as path separators so a track
 * title like "AC/DC" produces a single file instead of a nested folder.
 */
export function sanitizeFilename(name) {
  return name.replace(/\//g, "|");
}
