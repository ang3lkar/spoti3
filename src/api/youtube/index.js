import "dotenv/config";
import axios from "axios";
import { QuotaExceededError } from "../../domain/errors.js";
import { logger } from "../../utils/logger.js";
import { api } from "../../config/index.js";

const { API_KEY, SEARCH_URL, SEARCH_PARAMS } = api.YOUTUBE;

const url = "https://www.googleapis.com/youtube/v3/search";
const playlistUrl = "https://www.googleapis.com/youtube/v3/playlists";
const playlistItemsUrl = "https://www.googleapis.com/youtube/v3/playlistItems";

const searchParams = {
  part: "snippet",
  type: "video",
  videoCategoryId: "10", // Category ID for Music
  key: API_KEY,
  maxResults: 1,
};

// Function to search for a video on YouTube
export async function searchYouTube(query) {
  logger.debug(`Searching YouTube for ${query}`);

  try {
    const response = await axios.get(url, {
      params: {
        ...searchParams,
        q: query,
      },
    });

    const items = response.data.items;

    if (items.length > 0) {
      const video = items[0];

      return {
        videoId: video.id.videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
      };
    } else {
      return null;
    }
  } catch (error) {
    throw new QuotaExceededError(error.message);
  }
}

/**
 * Fetch the details of a YouTube playlist
 *
 * @param {object} param0 { youtubeId }
 * @returns {object} Playlist details
 */
export async function fetchPlaylistDetails({ youtubeId } = {}) {
  const { type, value } = youtubeId;

  logger.debug(`Fetching YouTube ${type} details`);

  if (type === "playlist") {
    try {
      const response = await axios.get(playlistUrl, {
        params: {
          part: "snippet,contentDetails",
          id: value,
          key: API_KEY,
        },
      });

      const items = response.data.items;

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      logger.debug(`Fetched playlist details: ${playlist.snippet.title}`);

      return {
        name: playlist.snippet.title,
        description: playlist.snippet.description,
        channelTitle: playlist.snippet.channelTitle,
        publishedAt: playlist.snippet.publishedAt,
        thumbnails: playlist.snippet.thumbnails,
        itemCount: playlist.contentDetails.itemCount,
        playlistId: playlist.id,
        items,
      };
    } catch (err) {
      throw err;
    }
  } else if (type === "video") {
    // For single videos, create a playlist-like structure
    try {
      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/videos",
        {
          params: {
            part: "snippet,contentDetails",
            id: value,
            key: API_KEY,
          },
        }
      );

      const items = response.data.items;

      const video = items[0];

      logger.debug(`Fetched video details: ${video.snippet.title}`);

      return {
        name: "Misc",
        description: video.snippet.description,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        thumbnails: video.snippet.thumbnails,
        itemCount: 1,
        videoId: video.id,
        tracks: items,
      };
    } catch (err) {
      throw err;
    }
  } else {
    throw new Error(`Unsupported YouTube ID type: ${type}`);
  }
}

/**
 * Fetch the tracks of a YouTube playlist
 *
 * @param {object} param0 { youtubeId }
 * @returns {Array} Array of playlist items
 */
export async function fetchTracks({ youtubeId }) {
  const { type, value } = youtubeId;

  logger.debug(`Fetching YouTube ${type} tracks`);

  if (type === "playlist") {
    try {
      const response = await axios.get(playlistItemsUrl, {
        params: {
          part: "snippet,contentDetails",
          playlistId: value,
          key: API_KEY,
          maxResults: 50, // YouTube API max per request
        },
      });

      let items = response.data.items;
      let nextPageToken = response.data.nextPageToken;

      // Handle pagination for large playlists
      while (nextPageToken) {
        const nextResponse = await axios.get(playlistItemsUrl, {
          params: {
            part: "snippet,contentDetails",
            playlistId: value,
            key: API_KEY,
            maxResults: 50,
            pageToken: nextPageToken,
          },
        });

        items = items.concat(nextResponse.data.items);
        nextPageToken = nextResponse.data.nextPageToken;
      }

      logger.debug(`Fetched ${items.length} playlist items`);

      return items;
    } catch (err) {
      logger.error(`Error fetching playlist tracks: ${err.message}`);
      throw err;
    }
  } else if (type === "video") {
    // For single videos, return the video as a single item
    try {
      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/videos",
        {
          params: {
            part: "snippet,contentDetails",
            id: value,
            key: API_KEY,
          },
        }
      );

      const video = response.data.items[0];
      if (!video) {
        throw new Error("Video not found");
      }

      // Convert video to playlist item format
      const playlistItem = {
        snippet: video.snippet,
        contentDetails: video.contentDetails,
        id: { videoId: video.id },
      };

      logger.debug(`Fetched 1 video item`);

      return [playlistItem];
    } catch (err) {
      logger.error(`Error fetching video: ${err.message}`);
      throw err;
    }
  } else {
    throw new Error(`Unsupported YouTube ID type: ${type}`);
  }
}
