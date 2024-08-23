import 'dotenv/config';
import axios from "axios";
import fs from "fs";
import { titleToFriendlyName } from "./utils.js";

const token = process.env.SPOTIFY_TOKEN;

// Function to extract playlist ID from URL
function extractPlaylistId(url) {
  const regex = /https?:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  if (match) {
    return match[1];
  } else {
    throw new Error("Invalid Spotify playlist URL");
  }
}

async function getPlaylistDetails(playlistId) {
  let url = `https://api.spotify.com/v1/playlists/${playlistId}`;

  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    name: response.data.name
  };
}

async function getPlaylistTracks(playlistId) {
  let tracks = [];
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
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

// Main function
export async function importToFile() {
  try {
    const playlistUrl = process.argv[2];
    if (!playlistUrl) {
      console.error(
        "Please provide a Spotify playlist URL as a command line argument."
      );
      return;
    }

    const playlistId = extractPlaylistId(playlistUrl);

    const playlistDetails = await getPlaylistDetails(playlistId);

    const outputFile = `playlist_${titleToFriendlyName(playlistDetails.name)}.txt`;

    const tracks = await getPlaylistTracks(playlistId);

    saveToTextFile(tracks, outputFile);

    return outputFile;
  } catch (error) {
    console.error("Error:", JSON.stringify(error));
  }
}

await importToFile();
