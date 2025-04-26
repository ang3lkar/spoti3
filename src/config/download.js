/**
 * Download Configuration
 */

export const DOWNLOAD = {
  DEFAULT_OPTIONS: {
    mock: false,
    force: false,
    albumTag: false,
  },
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // milliseconds
  CONCURRENT_DOWNLOADS: 1,
};
