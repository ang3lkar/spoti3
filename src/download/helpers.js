import {checkMark, failMark} from "../constants.js"

function applyCheckmark(track) {
	return track.includes(checkMark) ? "" : checkMark;
}

export function lineWithCheckmark(track) {
	return `${track} ${applyCheckmark(track)}` + "\n";
}

export function lineWithX(track) {
	return `${track} ${failMark}` + "\n";
}

export function hasBeenAttempted(track) {
	return track.includes(checkMark) || track.includes(failMark);
}
