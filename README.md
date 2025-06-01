# Spoti3

[![Tests](https://github.com/ang3lkar/spoti3/workflows/Run%20Tests/badge.svg)](https://github.com/ang3lkar/spoti3/actions) [![Version](https://img.shields.io/github/package-json/v/ang3lkar/spotify-playlist-extraction)](https://github.com/ang3lkar/spotify-playlist-extraction) [![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

> A simple CLI tool to download songs from Spotify playlists to MP3 format using YouTube

This tool combines several APIs to achieve seamless playlist downloading:

- **Spotify API** - to get playlist contents
- **YouTube Search API** - to find matching songs
- **yt-dlp** - to download songs from YouTube in MP3 format

## ✨ Features

- 🎵 Download entire Spotify playlists as MP3 files
- 🏷️ Automatic MP3 tagging with song metadata
- 🔍 Smart YouTube search matching
- 🎛️ Configurable album tagging
- 🚀 Fast concurrent downloads
- 📋 Mock mode for testing without downloading

## 📋 Requirements

- [Node.js](https://nodejs.org/) (v18 or higher)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [ffmpeg](https://ffmpeg.org/)
- Spotify Developer Account
- YouTube Developer Account

## 🚀 Installation

### Quick Install

```bash
npm install -g spoti3
```

### Development Setup

```bash
git clone https://github.com/ang3lkar/spoti3.git
cd spoti3
npm install
```

## ⚙️ Configuration

Create a `.env` file in the project root:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
YOUTUBE_API_KEY=your_youtube_api_key
```

### Getting API Keys

1. **Spotify**: Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. **YouTube**: Visit [Google Cloud Console](https://console.cloud.google.com/) and enable YouTube Data API v3

## 📖 Usage

### Basic Usage

```bash
# Download playlist to MP3
npm run start <spotify_playlist_url>
npm run start <spotify_album_url>
npm run start <spotify_track_url>

# Example
npm run start https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
```

**Note**: playlists made by Spotify are not always available to download.

### Advanced Options

```bash
spoti3 mp3 [options] <playlistUrl>

Options:
  -m, --mock       Mock mode - show commands without downloading
  -a, --album-tag  Set custom album name (defaults to playlist name)
  -f, --force      Force download all tracks (ignore existing files)
  -h, --help       Show help information
```

### Examples

```bash
# Mock run to see what would be downloaded
spoti3 mp3 --mock https://open.spotify.com/playlist/...

# Custom album name
spoti3 mp3 --album-tag "My Favorite Songs" https://open.spotify.com/playlist/...

# Force re-download existing files
spoti3 mp3 --force https://open.spotify.com/playlist/...
```

## 🔧 Troubleshooting

### Common Issues

**"yt-dlp not found"**

```bash
# Install yt-dlp
pip install yt-dlp
# or
brew install yt-dlp
```

**"ffmpeg not found"**

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

**Rate limit errors**

- YouTube API has daily quotas (100 songs/day)
- Consider getting a higher quota from Google Cloud Console

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Legal Notice

This tool is for educational purposes. Please respect:

- Artist and label copyrights
- Platform terms of service
- Local laws regarding media downloading

## 🙏 Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) for YouTube downloading
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) for playlist data
- [YouTube Data API](https://developers.google.com/youtube/v3) for video search
