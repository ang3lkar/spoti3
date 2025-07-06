import { fetchPlaylist as fetchSpotifyPlaylist } from "./spotify.js";
import { fetchPlaylist as fetchYouTubePlaylist } from "./youtube.js";

const fetchPlaylist = async (url, options) => {
  if (options.source === "spotify") {
    return fetchSpotifyPlaylist(url, options);
  } else if (options.source === "youtube") {
    return fetchYouTubePlaylist(url, options);
  }

  throw new Error("Invalid source");
};

export { fetchPlaylist };
