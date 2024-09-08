import "dotenv/config";
import axios from "axios";
import fs from "fs";
import { titleToFriendlyName } from "./utils.js";

const tokenUrl = 'https://accounts.spotify.com/api/token';

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

async function getAccessToken() {
  const authOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    data: 'grant_type=client_credentials', // Manually encoded body
    url: tokenUrl,
  };

  try {
    const response = await axios(authOptions);
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token', error);
  }
}

function extractPlaylistId(url) {
	const regex = /https?:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/;
	const match = url.match(regex);
	if (match) {
		return match[1];
	} else {
		throw new Error("Invalid Spotify playlist URL");
	}
}

async function getPlaylistDetails(accessToken, playlistId) {
	let url = `https://api.spotify.com/v1/playlists/${playlistId}`;

	const response = await axios.get(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	return {
		name: response.data.name,
	};
}

async function getPlaylistTracks({accessToken, playlistId}) {
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

		tracks.push(trackLine);
	});

	// Get the next page of results, if available
	url = response.data.next;

	return tracks;
}

function saveToTextFile(data, filename) {
	fs.writeFileSync(filename, data.join("\n"));
	console.log(`Playlist tracks saved to ${filename}`);
}

export async function importToFile({playlistUrl}) {
	try {
		const playlistId = extractPlaylistId(playlistUrl);

    const accessToken = await getAccessToken();

		const playlistDetails = await getPlaylistDetails(accessToken, playlistId);

		const outputFile = `${titleToFriendlyName(
			playlistDetails.name
		)}.txt`;

		const tracks = await getPlaylistTracks({accessToken, playlistId});

		// TODO: Keep tracks original ordering so as to set the correct track number
		// on the mp3 files
		const sortedTracks = tracks.sort();

		saveToTextFile(sortedTracks, outputFile);

		return outputFile;
	} catch (error) {
		console.error("Error:", error.message);
	}
}
