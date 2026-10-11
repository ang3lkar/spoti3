import { execSync } from "child_process";
import { logger } from "../../utils/logger.js";

export const STALE_AFTER_DAYS = 45;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const VERSION_PATTERN = /^(\d{4})\.(\d{2})\.(\d{2})(?:\.\d+)?$/;

let hintShown = false;
let cachedAgeDays;

export function parseYtDlpVersionDate(versionString) {
  const match = VERSION_PATTERN.exec(String(versionString ?? "").trim());
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return valid ? date : null;
}

export function ytDlpAgeDays(versionString, now = new Date()) {
  const released = parseYtDlpVersionDate(versionString);
  if (!released) return null;
  return Math.floor((now.getTime() - released.getTime()) / MS_PER_DAY);
}

export function getYtDlpAgeDays() {
  if (cachedAgeDays !== undefined) return cachedAgeDays;
  try {
    const version = execSync("yt-dlp --version", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    cachedAgeDays = ytDlpAgeDays(version);
  } catch {
    cachedAgeDays = null;
  }
  return cachedAgeDays;
}

export function hintIfStale({ ageDays, log = logger } = {}) {
  try {
    if (hintShown) return false;
    const days = ageDays === undefined ? getYtDlpAgeDays() : ageDays;
    if (days === null || days <= STALE_AFTER_DAYS) return false;
    hintShown = true;
    log.warn(`yt-dlp is ${days} days old and may be failing because of it. Try: brew upgrade yt-dlp`);
    return true;
  } catch {
    return false;
  }
}

export function resetStalenessState() {
  hintShown = false;
  cachedAgeDays = undefined;
}
