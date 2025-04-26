import { app } from "../config/index.js";

const { CHECK_MARK, FAIL_MARK } = app.SYMBOLS;

function applyCheckmark(track) {
  return track.includes(CHECK_MARK) ? " " : CHECK_MARK;
}

export function lineWithCheckmark(track) {
  return `${applyCheckmark(track)} ${track}` + "\n";
}

export function lineWithX(track) {
  return `${FAIL_MARK} ${track}` + "\n";
}
