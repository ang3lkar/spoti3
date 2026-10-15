# Changelog

## [1.9.0] - 2026-10-15

### Added
- `--yolo` flag for `mp3`: skips interactive prompts and accepts the calculated tags
- Greek-to-Latin transliteration of track titles and artists, download folder names, file names and ID3 tags
- `latinize` command: replaces Greek characters with Latin ones in file/folder names and MP3 tags of a directory (`--dry-run` to preview)
- After a failed download, a hint to upgrade yt-dlp is shown when the installed version is more than 45 days old
- Thumbnail preview in the interactive prompt now works in Ghostty, Kitty and herdr (Kitty graphics protocol), alongside iTerm2 and WezTerm

### Changed
- Single-track downloads no longer offer "remember for next tracks" options in the artist and thumbnail prompts

### Fixed
- Kitty is no longer treated as an iTerm2-compatible terminal for the thumbnail preview, since it does not support that image protocol

### Removed
- Interactive prompt auto-accept timeout and the `PROMPT_TIMEOUT_SECONDS` env var; prompts now wait for input

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
