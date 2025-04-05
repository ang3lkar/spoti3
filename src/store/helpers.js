import { checkMark, failMark } from "../constants.js";

function applyCheckmark(track) {
  return track.includes(checkMark) ? " " : checkMark;
}

export function lineWithCheckmark(track) {
  return `${applyCheckmark(track)} ${track}` + "\n";
}

export function lineWithX(track) {
  return `${failMark} ${track}` + "\n";
}
