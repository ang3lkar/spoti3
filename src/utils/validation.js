/**
 * Validates the URL and returns the source and value
 * @param {string} url The URL to validate
 * @returns {object} { value: url, source: "spotify" | "youtube" }
 * @throws {Error} If the URL is not a valid Spotify or YouTube URL
 */
export function validateUrl(url) {
  if (url.includes("spotify.com")) {
    return { value: url, source: "spotify" };
  } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return { value: url, source: "youtube" };
  }

  throw new Error("Invalid URL - must be a Spotify or YouTube URL");
}
