function checkmark(track) {
	return track.includes("✔️") ? "" : "✔️";
}

export function lineWithCheckmark(track) {
	return `${track} ${checkmark(track)}` + "\n";
}

export function lineWithX(track) {
	return `${track} X` + "\n";
}

export function nonDownloaded(track) {
	return !track.includes("✔️") && !track.includes("X");
}
