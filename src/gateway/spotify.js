import axios from "axios";
import { logger } from "../utils/logger.js";

const tokenUrl = "https://accounts.spotify.com/api/token";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

/**
 * Get an temporary access token from Spotify
 * @returns {string} The access token
 */
export async function fetchAccessToken() {
	const authOptions = {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization:
				"Basic " +
				Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
		},
		data: "grant_type=client_credentials", // Manually encoded body
		url: tokenUrl,
	};

	try {
		const response = await axios(authOptions);

		const result = response.data.access_token;

		logger.debug("Access token fetched successfully");

		return result;
	} catch(err) {
		logger.error(`Error fetching access token: ${err.message}`);
	}
}

/**
 * Fetch the details of a Spotify playlist
 *
 * @param {*} param0
 * @returns
 */
export async function fetchPlaylistDetails({accessToken, spotifyId}) {
	const {type, value} = spotifyId;

	logger.debug(`Fetching ${type} details`);

	let url = `https://api.spotify.com/v1/${type}s/${value}`;

	try {
		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		logger.debug(`Fetched ${type} details`);

		return {
			...response.data
		};
	} catch(err) {
		logger.error(`Error fetching playlist details: ${err.message}`);
		throw err;
	}
}

export async function fetchTracks({ accessToken, spotifyId }) {
	const {type} = spotifyId;

	if (type === 'track') {
		return fetchSingleTrack({ accessToken, spotifyId });
	} else {
		return fetchMultipleTracks({ accessToken, spotifyId });
	}
}

/**
 * Fetch the tracks of a Spotify playlist
 *
 * https://developer.spotify.com/documentation/web-api/reference/get-playlists-tracks
 *
 * @param {*} param0
 * @returns
 */
export async function fetchMultipleTracks({ accessToken, spotifyId, url }) {
	const {type, value} = spotifyId;
	const result = [];

	logger.debug(`Fetching ${type} tracks`);

	let tracksUrl = url || `https://api.spotify.com/v1/${type}s/${value}/tracks`;

	const response = await axios.get(tracksUrl, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	const next = response.data.next;

	if (next) {
		const nextTracks = await fetchMultipleTracks({ accessToken, spotifyId, url: next });
		result.push(...response.data.items.concat(nextTracks));
	} else {
		result.push(...response.data.items);
	}

	if (!url) {
		logger.debug(`Fetched ${result.length} tracks`);
	}

	return result;
}

export async function fetchSingleTrack({ accessToken, spotifyId }) {
	const {value} = spotifyId;

	logger.debug(`Fetching a single track`);

	let url = `https://api.spotify.com/v1/tracks/${value}`;

	const response = await axios.get(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	const result = response.data;

	logger.debug(`Fetched track`);

	return [result];
}
