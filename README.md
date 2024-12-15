# Spoti3

This is a simple script that allows you to download songs from Spotify to mp3 format.

It combines several APIs to achieve this:

- The Spotify playlist API, to get the contents of a playlist URL.
- The Youtube Search API to search for the song
- `yt-dlp` to download the song from YouTube

## Requirements

The project assumes you already have `yt-dlp` and `ffmpeg` installed in your system.

- Node.js
- A Spotify developer account
- A Youtube developer account

## Installation

```bash
npm install
```

Setup your developer keys:

```
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
YOUTUBE_API_KEY=
```

## Usage

```bash
# Get the song names and artists from a Spotify playlist in to a <playlist_name>.txt
node src/import.js <spotify_url>

# Download the songs in mp3 format from the <playlist>.txt
node src/index.js mp3 <playlist_name>.txt
```

Options:

```
Usage: spoti3 mp3 [options] <playlistUrl>

Downloads a tracklist into mp3 files from YouTube

Arguments:
  playlistUrl      the Spotify playlist URL

Options:
  -m, --mock       do not download the files, just print the commands
  -a, --album-tag  set album name in mp3 files, defaults to playlist name
  -f, --force      force download of all tracks
  -h, --help       display help for command
```

## Notes

> [!WARNING]
> Beware of quotas and limits, especially for Youtube API, which has an increased quota impact: A call to this method has a quota cost of 100 units!
>
> So, essentially, you can only download 100 songs per day.

## Pending

- [x] dotenv for API keys.
- [x] Handle quotas error.
- [x] Dynamic file names based on the playlist name.
- [x] How are quotas handled by Youtube Search API? It registers much more requests than expected.
- [x] Resume from last track downloaded.
- [x] Move files under src folder.
- [x] Avoid streaming
- [x] Import script should use username/password to retrieve token
- [x] Use Spotify track name instead of YouTube's
- [x] Remove youtube ids from the file
- [x] Handle SIGTERM and SIGINT signals.
- [x] Apply mp3 tag after download
- [x] Add cli option for playlist's tag
- [ ] Set up logging (with debug)
- [ ] Smooth API, run each function independently or all at once.
- [ ] Add a way to download the songs in parallel.
- [ ] Add a progress bar and colors.
