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

/**
 * Fetch the tracks of a Spotify playlist
 *
 * @param {*} param0
 * @returns
 */
export async function fetchPlaylistTracks({ accessToken, spotifyId }) {
	const {type, value} = spotifyId;

	logger.debug(`Fetching ${type} tracks`);

	let url = `https://api.spotify.com/v1/${type}s/${value}/tracks`;

	const response = await axios.get(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	const result = response.data.items;

	logger.debug(`Fetched ${result.length} tracks`);

	return result;
}
