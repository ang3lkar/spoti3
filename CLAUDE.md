# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spoti3 is a CLI tool that downloads songs from Spotify playlists/albums/tracks to MP3 format using YouTube as the source. It fetches playlist metadata from Spotify, searches for matching videos on YouTube, downloads them using yt-dlp, and tags the MP3 files with proper metadata.

## Development Commands

```bash
# Download a playlist/album/track to MP3
npm run start <url>

# Import a playlist to a text file (playlists/ folder)
node src/cli/index.js import <url>

# Debug mode with detailed logging
npm run debug <url>

# Run all tests (uses Node.js built-in test runner)
npm test

# Run tests in a specific file
node --test src/utils/__tests__/basic.test.js

# Run ESLint
npm run lint
```

The `mp3` subcommand accepts `--force` (re-download existing files) and `--album-tag` (override album ID3 tag).

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

### Two Workflows

**`mp3` command** (download flow):
1. CLI validates URL → identifies source as `spotify` or `youtube`
2. `src/services/index.js` routes to the appropriate service
3. For Spotify: fetches playlist metadata and constructs `searchTitle` per track for YouTube search
4. For YouTube: fetches playlist/video/channel details directly
5. `src/domain/download/playlist.js` loops over tracks: calls yt-dlp via `downloadTrack()`, then tags with `saveTrackTags()`
6. MP3s saved to `downloads/<playlist-name>/`

**`import` command** (save-to-file flow):
1. Fetches playlist metadata same as above
2. Saves track list (`id: fullTitle` lines) to `playlists/<name>.txt` via `src/store/file.js`
3. Skips save if file already exists (use `--force` to overwrite)

### Key Modules

**URL Validation** (`src/utils/validation.js`) — identifies source as `spotify` or `youtube`, used at CLI entry before any fetching.

**Playlist Fetching** (`src/services/spotify/index.js`, `src/services/youtube/index.js`) — normalizes API responses into `{ name, folderName, tracks[] }`. Spotify tracks get `fullTitle` with ordinal prefix (e.g. `01. Artist - Song`) and a `searchTitle` for YouTube lookup; YouTube tracks already have a `videoId`.

**Track Downloading** (`src/domain/download/track.js`) — decides whether to search YouTube (Spotify tracks) or use the existing `videoId` (YouTube tracks); calls yt-dlp via `src/domain/convert/index.js`; skips already-downloaded files unless `--force`.

**Interactive Prompt** (`src/domain/download/track.js:promptForTrackMetadata`) — only fires for YouTube-sourced tracks when `logger.prompt` is available; allows confirming/editing artist, title, and thumbnail before tagging.

**MP3 Tagging** (`src/domain/tag/index.js`) — uses mp3tag.js to write ID3 tags (title, artist, album, track number, cover art embedded from Spotify/YouTube thumbnail URL).

## Configuration

### Environment Variables

Required API keys in `.env` (see `.env.sample`):

- `SPOTIFY_CLIENT_ID` - From Spotify Developer Dashboard
- `SPOTIFY_CLIENT_SECRET` - From Spotify Developer Dashboard
- `YOUTUBE_API_KEY` - From Google Cloud Console (YouTube Data API v3)
- `LOG_LEVEL` - Optional: debug, info, warn, error (default: info)
- `PROMPT_TIMEOUT_SECONDS` - Optional: seconds to wait for interactive prompts before accepting the default; `0` waits indefinitely (default: 5)

### External Dependencies

- **yt-dlp** - Must be installed globally, used to download audio from YouTube
- **ffmpeg** - Required by yt-dlp for audio conversion to MP3

## Testing Strategy

Tests use Node.js built-in test runner (`node:test`). `npm test` auto-discovers all `*.test.js` files. Test files live in:

- `src/utils/__tests__/` — utility function tests
- `src/services/__tests__/` — service layer tests
- `src/services/spotify/*.test.js` — Spotify tests co-located with implementation

When adding new utility functions, add tests to existing `__tests__` files rather than creating new test files.

Services support a `mock` option (`options.mock = true`) that swaps in `src/api/mock/index.js`, which returns a static fixture playlist — useful for tests that exercise the domain layer without hitting APIs.

## Coding Patterns

- **Simplicity first** - Prefer simple solutions, avoid over-engineering
- **No duplication** - Check for existing implementations before adding new code
- **File size limit** - Keep files under 300 lines, refactor into smaller modules if needed
- **Use existing packages** - Only use dependencies already in package.json
- **ES Modules** - Project uses `"type": "module"` in package.json, use import/export syntax
- **Minimal comments** - Use comments sparingly, only for complex code that isn't self-evident

## Common Gotchas

- **ffmpeg path hardcoded**: `src/domain/convert/index.js` passes `--ffmpeg-location /opt/homebrew/bin/ffmpeg` — this assumes macOS with Homebrew. Change this if ffmpeg is installed elsewhere.
- **API Rate Limits**: YouTube API has daily quotas (~100 songs/day). Quota exceeded errors are thrown as `QuotaExceededError` (`src/domain/errors.js`) and cause a clean exit.
- **Signal Handling**: The download loop handles SIGINT (Ctrl+C) gracefully in `src/domain/download/playlist.js`; exits with code 130.
- **Track Matching**: YouTube search may not always find the exact song. The matching logic is in `src/services/youtube/index.js`.
- **API Caching**: API responses are cached in `.cache/` to avoid repeated calls during development.
- **Spotify Playlists**: Some Spotify-curated playlists may not be downloadable due to API restrictions.

## Development guidelines

When asked to bump a version, update CHANGELOG.md. 


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
