# Changelog

## [1.8.3] - 2026-06-26

### Added
- Interactive metadata prompts for YouTube downloads: confirm or edit the artist, title, and thumbnail before tagging, each with an "accept and remember for next tracks" option
- Custom thumbnail URL option in the thumbnail prompt
- Prompt to confirm the download folder name before a download starts
- Artist is inferred from a YouTube "Artist - Topic" channel name, preferring the video owner channel and never suggesting "YouTube" as the artist
- Interactive prompts auto-accept after a timeout for unattended downloads, configurable via the `PROMPT_TIMEOUT_SECONDS` env var (default 5s; `0` waits indefinitely)

### Fixed
- Ctrl+C during an interactive prompt now exits the program with code 130 instead of letting the track loop continue
- `/` in a track title or artist (e.g. "AC/DC") is sanitized so files no longer land in unintended subfolders
- Hyphenated titles (e.g. "Re-Hash", "Spider-Man") are kept whole when parsing YouTube metadata

### Changed
- Metadata (artist, title, thumbnail) is set up before the audio is downloaded, so tracks download straight to their final filename and the post-download rename step is gone

## [1.8.2] - 2026-06-21

### Added
- YouTube thumbnails are now center-cropped to square before embedding in MP3 tags
- Spotify credentials are optional when downloading YouTube URLs; a warning is emitted once if they are not configured
