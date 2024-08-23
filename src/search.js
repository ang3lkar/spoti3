import 'dotenv/config';
import axios from "axios";
import { QuotaExceededError } from "./errors.js";

const url = "https://www.googleapis.com/youtube/v3/search";

const API_KEY = process.env.YOUTUBE_API_KEY;

const searchParams = {
  part: "snippet",
  type: "video",
  videoCategoryId: "10", // Category ID for Music
  key: API_KEY,
  maxResults: 1,
}

// Function to search for a video on YouTube
export async function searchYouTube(query) {
  try {
    const response = await axios.get(url, {
      params: {
        ...searchParams,
        q: query
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
