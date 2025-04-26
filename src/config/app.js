/**
 * Application Configuration
 */

export const FOLDERS = {
  DOWNLOADS: "downloads",
  PLAYLISTS: "playlists",
};

export const SYMBOLS = {
  CHECK_MARK: "✔",
  FAIL_MARK: "✗",
};

export const LOGGING = {
  LEVEL: process.env.LOG_LEVEL || "info",
  LEVELS: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
};
