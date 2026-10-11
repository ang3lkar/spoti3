import { execSync } from "child_process";
import { logger } from "../../utils/logger.js";

export const STALE_AFTER_DAYS = 45;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const VERSION_PATTERN = /^(\d{4})\.(\d{2})\.(\d{2})(?:\.\d+)?$/;

let hintAttempted = false;

export function ytDlpAgeDays(version, now = new Date()) {
  const match = VERSION_PATTERN.exec(version.trim());
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  return Math.floor((now - Date.UTC(year, month - 1, day)) / MS_PER_DAY);
}

function getYtDlpAgeDays() {
  try {
    const version = execSync("yt-dlp --version", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return ytDlpAgeDays(version);
  } catch {
    return null;
  }
}

export function hintIfStale({ ageDays } = {}) {
  if (hintAttempted) return;
  hintAttempted = true;
  const days = ageDays === undefined ? getYtDlpAgeDays() : ageDays;
  if (days === null || days <= STALE_AFTER_DAYS) return;
  logger.warn(`yt-dlp is ${days} days old and may be failing because of it. Try: brew upgrade yt-dlp`);
}

export function resetStalenessState() {
  hintAttempted = false;
}
