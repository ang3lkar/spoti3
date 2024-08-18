import 'dotenv/config';
import axios from "axios";
import fs from "fs";

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

// Function to get playlist tracks
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

// Function to save data to a text file
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
    const outputFile = "playlist_tracks.txt"; // Output file name

    const playlistId = extractPlaylistId(playlistUrl);

    const tracks = await getPlaylistTracks(playlistId);

    saveToTextFile(tracks, outputFile);
  } catch (error) {
    console.error("Error:", JSON.stringify(error));
  }
}

importToFile();
