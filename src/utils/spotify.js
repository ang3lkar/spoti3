import { logger } from "./logger.js";

export function extractSpotifyId(url) {
  logger.debug("Extracting Spotify ID from spotify URL");

  const regex =
    /https?:\/\/open\.spotify\.com\/(playlist|album|track)\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  if (match) {
    logger.debug(
      `Extracted Spotify ID from spotify URL (type=${match[1]}) (spotifyId=${match[2]})`
    );

    return { type: match[1], value: match[2] };
  } else {
    throw new Error("Invalid Spotify URL");
  }
}
