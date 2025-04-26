/**
 * API Configuration
 */

export const SPOTIFY = {
  CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
  TOKEN_URL: "https://accounts.spotify.com/api/token",
  API_BASE_URL: "https://api.spotify.com/v1",
};

export const YOUTUBE = {
  API_KEY: process.env.YOUTUBE_API_KEY,
  SEARCH_URL: "https://www.googleapis.com/youtube/v3/search",
  SEARCH_PARAMS: {
    part: "snippet",
    type: "video",
    videoCategoryId: "10", // Category ID for Music
    maxResults: 1,
  },
};
