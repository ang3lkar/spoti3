import { fetchPlaylist as fetchSpotifyPlaylist } from "./spotify.js";

const fetchPlaylist = async (url, options) => {
  if (options.source === "spotify") {
    return fetchSpotifyPlaylist(url, options);
  }

  throw new Error("Invalid source");
};

export { fetchPlaylist };
