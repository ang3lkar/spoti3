# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spoti3 is a CLI tool that downloads songs from Spotify playlists/albums/tracks to MP3 format using YouTube as the source. It fetches playlist metadata from Spotify, searches for matching videos on YouTube, downloads them using yt-dlp, and tags the MP3 files with proper metadata.

## Development Commands

### Running the Application

```bash
# Download a playlist/album/track
npm run start <spotify_url>

# Debug mode with detailed logging
npm run debug <spotify_url>
```

### Testing

```bash
# Run all tests (uses Node.js built-in test runner)
npm test

# Run tests in a specific file
node --test src/utils/__tests__/basic.test.js
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Architecture Overview

The codebase follows a layered architecture with clear separation of concerns:

### Directory Structure

- **`/src/cli`** - CLI entry point using Commander.js, parses arguments and routes to domain layer
- **`/src/domain`** - Core business logic for downloading playlists/tracks, converting, and tagging
- **`/src/services`** - Higher-level workflows that orchestrate API calls (Spotify playlist fetching, YouTube search)
- **`/src/api`** - Low-level API clients (Spotify, YouTube)
- **`/src/config`** - Configuration constants (API keys, app settings, download settings)
- **`/src/store`** - Persistence layer for saving playlists to disk
- **`/src/utils`** - Shared utility functions (logging, caching, file operations, validation)

### Data Flow

1. **CLI** (`src/cli/index.js`) receives user input and validates the URL
2. **Services** (`src/services/index.js`) routes to appropriate service based on URL source (Spotify/YouTube)
3. **API clients** fetch playlist metadata from Spotify API
4. **Services** search YouTube for matching tracks for each song
5. **Domain layer** (`src/domain/download/playlist.js`) orchestrates downloading each track:
   - Calls yt-dlp via `downloadTrack()` to download MP3
   - Tags MP3 files with metadata via `saveTrackTags()`
6. Downloads are saved to `downloads/<playlist-name>/` folder

### Key Modules

**URL Validation** (`src/utils/validation.js`)

- Validates and identifies source (Spotify vs YouTube)
- Used at CLI entry point before fetching playlist

**Playlist Fetching** (`src/services/spotify/index.js`, `src/services/youtube/index.js`)

- Fetches playlist/album/track metadata from Spotify API
- Searches YouTube API for each track to find matching videos
- Returns normalized playlist object with track list

**Track Downloading** (`src/domain/download/track.js`)

- Executes yt-dlp command to download from YouTube
- Handles file naming, folder structure

**MP3 Tagging** (`src/domain/tag/index.js`)

- Uses mp3tag.js to write ID3 tags (title, artist, album, track number, cover art)
- Downloads cover art from Spotify and embeds into MP3

## Configuration

### Environment Variables

Required API keys in `.env` (see `.env.sample`):

- `SPOTIFY_CLIENT_ID` - From Spotify Developer Dashboard
- `SPOTIFY_CLIENT_SECRET` - From Spotify Developer Dashboard
- `YOUTUBE_API_KEY` - From Google Cloud Console (YouTube Data API v3)
- `LOG_LEVEL` - Optional: debug, info, warn, error (default: info)

### External Dependencies

- **yt-dlp** - Must be installed globally, used to download audio from YouTube
- **ffmpeg** - Required by yt-dlp for audio conversion to MP3

## Testing Strategy

Tests use Node.js built-in test runner (node:test). Test files are located:

- `src/utils/__tests__/` - Utility function tests
- `src/services/__tests__/` - Service layer integration tests
- `src/services/spotify/*.test.js` - Spotify-specific tests co-located with implementation

When adding new utility functions, add tests to existing test files in `__tests__` folders rather than creating new test files.

## Coding Patterns

- **Simplicity first** - Prefer simple solutions, avoid over-engineering
- **No duplication** - Check for existing implementations before adding new code
- **File size limit** - Keep files under 300 lines, refactor into smaller modules if needed
- **Use existing packages** - Only use dependencies already in package.json
- **ES Modules** - Project uses `"type": "module"` in package.json, use import/export syntax
- **Minimal comments** - Use comments sparingly, only for complex code that isn't self-evident

## Common Gotchas

- **API Rate Limits**: YouTube API has daily quotas (~100 songs/day). Quota exceeded errors are handled via `QuotaExceededError` in `src/domain/errors.js`
- **Signal Handling**: The download loop handles SIGINT (Ctrl+C) gracefully in `src/domain/download/playlist.js`
- **Track Matching**: YouTube search may not always find the exact song. The matching logic is in `src/services/youtube/index.js`
- **API Caching**: API responses are cached in `.cache/` directory to avoid repeated calls during development
- **Spotify Playlists**: Some Spotify-curated playlists may not be downloadable due to API restrictions
