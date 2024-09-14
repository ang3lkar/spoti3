# Spotify to Mp3

This is a simple script that allows you to download songs from Spotify to mp3 format.

It combines several scripts to achieve this:

- `import.js` to get the song names and artist from a Spotify playlist URL
- `search.js` to search for the song in YouTube using the YouTube API
- `yt-dlp` to download the song from YouTube

## Requirements

The project assumes you already have `yt-dlp` and `ffmpeg` installed in your system.

- Node.js

## Installation

```bash
npm install
```

## Usage

```bash
# Get the song names and artists from a Spotify playlist in to a <playlist_name>.txt
node src/import.js <spotify_url>

# Download the songs in mp3 format from the <playlist>.txt
node src/index.js mp3 <playlist_name>.txt
```

## Notes

> [!WARNING]
> Beware of quotas and limits, especially from Youtube API, as it allows only 10_000 requests per day. Youtube search API has an increased quota impact: A call to this method has a quota cost of 100 units!
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
- [ ] Smooth API, run each function independently or all at once.
- [ ] Add a way to download the songs in parallel.
- [ ] Add a progress bar and colors.
