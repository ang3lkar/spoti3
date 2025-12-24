import { fetchPlaylist as fetchMockPlaylist } from "../api/mock/index.js";
import { fetchPlaylist as fetchSpotifyPlaylist } from "./spotify/index.js";
import { fetchPlaylist as fetchYouTubePlaylist } from "./youtube/index.js";

const fetchPlaylist = async (url, options) => {
  if (options.mock) {
    return fetchMockPlaylist(url, options);
  }

  if (options.source === "spotify") {
    return fetchSpotifyPlaylist(url, options);
  } else if (options.source === "youtube") {
    return fetchYouTubePlaylist(url, options);
  }

  throw new Error("Invalid source");
};

export { fetchPlaylist };
