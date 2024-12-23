import axios from "axios";

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
		return response.data.access_token;
	} catch(err) {
		// noop
	}
}

/**
 * Fetch the details of a Spotify playlist
 *
 * @param {*} param0
 * @returns
 */
export async function fetchPlaylistDetails({accessToken, playlistId}) {
	let url = `https://api.spotify.com/v1/playlists/${playlistId}`;

	const response = await axios.get(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	return {
		...response.data
	};
}

/**
 * Fetch the tracks of a Spotify playlist
 *
 * @param {*} param0
 * @returns
 */
export async function fetchPlaylistTracks({ accessToken, playlistId }) {
	let tracks = [];
	let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

	const response = await axios.get(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	response.data.items.forEach((item) => {
		const track = item.track;
		const trackLine = `${track.artists
			.map((artist) => artist.name)
			.join(", ")} - ${track.name}`;

		tracks.push({trackDetails: item, trackTitle: trackLine});
	});

	return tracks;
}

export async function fetchTrackDetails({ accessToken, trackId }) {
	let url = `https://api.spotify.com/v1/tracks/${trackId}`;

	const response = await axios.get(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	return {
		...response.data
	};
}
