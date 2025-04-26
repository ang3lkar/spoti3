import { saveToFile } from "./file.js";

export async function storePlaylist(playlist, options) {
  return saveToFile({
    playlist,
    options,
  });
}
