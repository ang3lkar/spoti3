# Spoti3

This is a simple script that allows you to download songs from Spotify to mp3 format.

It combines several APIs to achieve this:

- The Spotify playlist API, to get the contents of a playlist URL.
- The Youtube Search API to search for the song.
- The `yt-dlp` tool to actually download the song from YouTube in mp3 format.

## Requirements

- yt-dlp
- ffmpeg
- Node.js
- A Spotify developer account
- A Youtube developer account

## Installation

```bash
npm install
```

Setup your developer keys on a `.env` file:

```
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
YOUTUBE_API_KEY=
```

## Usage

```bash
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
