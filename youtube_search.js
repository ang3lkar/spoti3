import axios from "axios";
import { QuotaExceededError } from "./errors.js";

// Load YouTube API key from environment variables
const API_KEY = "AIzaSyCh-LnxsXf5J-_mgQXan2Y2U1icqLq9ux8";

const url = "https://www.googleapis.com/youtube/v3/search";

// Function to search for a video on YouTube
export async function searchYouTube(query) {
  try {
    const response = await axios.get(url, {
      params: {
        part: "snippet",
        q: query,
        type: "video",
        videoCategoryId: "10", // Category ID for Music
        key: API_KEY,
        maxResults: 1,
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
