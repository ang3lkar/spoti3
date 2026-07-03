/**
 * Download Configuration
 */

function parsePromptTimeoutSeconds(raw) {
  if (raw === undefined || raw === "") return 5;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : 5;
}

const PROMPT_TIMEOUT_SECONDS = parsePromptTimeoutSeconds(
  process.env.PROMPT_TIMEOUT_SECONDS
);

export const DOWNLOAD = {
  DEFAULT_OPTIONS: {
    mock: false,
    force: false,
    albumTag: false,
    yolo: false,
  },
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // milliseconds
  CONCURRENT_DOWNLOADS: 1,
  PROMPT_TIMEOUT_MS: PROMPT_TIMEOUT_SECONDS * 1000,
};
