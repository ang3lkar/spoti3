import { QuotaExceededError } from "../errors.js";
import { delay } from "../utils/basic.js";

export async function fetchTrackDetails({ track, tagOptions, downloadOptions }) {
	if (!track) {
		console.error("Missing track name");
		return { outcome: "MISSING_TRACK" };
	}

	if (downloadOptions.mock) {
		await delay(300);
		return { outcome: "SUCCESS" };
	}

	try {
		const trackDetails = await fetchTrackDetails(track);
	} catch (error) {
		if (error instanceof QuotaExceededError) {
			throw error;
		}

		console.error("Error during track download:", error.message);
		return { outcome: "DOWNLOAD_ERROR" };
	}
}
