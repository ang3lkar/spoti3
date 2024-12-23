import { saveToFile, getPendingTracksFromFile } from "./file.js";

export async function storePlaylist(playlist, options) {
  return saveToFile({
    playlist,
    options,
  });
}

export function getPendingTracks(playlist, options) {
  return getPendingTracksFromFile(playlist, options);
}
