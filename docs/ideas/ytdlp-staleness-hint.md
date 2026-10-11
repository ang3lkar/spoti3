# yt-dlp staleness hint

## Problem Statement
How might we tell the user their yt-dlp is probably out of date when it
matters (downloads breaking), without network calls, background work, or noise?

## Recommended Direction
Derive yt-dlp's age from its own date-based version string
(`yt-dlp --version` → 2026.08.19). No network, no cache file.
Two touchpoints, one shared helper:

1. Failure hint: when `mp3()` throws and yt-dlp is older than the threshold,
   print one line: "yt-dlp is N days old and may be failing because of it.
   Try: brew upgrade yt-dlp". Never claim certainty.
2. Startup nudge: at the start of `mp3`, if yt-dlp is older than the
   threshold, print the same single line once.

Both print at most once per run. Any failure to read or parse the version
is swallowed silently.

## Key Assumptions to Validate
- [ ] Version string parses as a date on this machine's yt-dlp — test
      with 2026.08.19 plus a suffixed form like 2026.08.19.1
- [ ] 45 days is a sensible threshold — use it for a few weeks, adjust
- [ ] Failures caused by staleness are common enough to justify the hint —
      note how often the hint fires and whether upgrading actually fixed it

## MVP Scope
In: `getYtDlpAge()` helper (spawn once, memoize, parse, return days or null),
threshold constant, startup nudge in the mp3 flow, failure hint in the
download error path, tests for the parser and threshold logic.
Out: everything in the list below.

## Not Doing (and Why)
- GitHub releases check — needs network, a cache file and error handling for a "newer exists" fact we don't need yet
- Background/detached checking — a short-lived CLI can't do it reliably, and with no network there's nothing to check
- Auto-upgrading — silently changes the user's system
- Interactive "Upgrade now?" prompt — notify-only was chosen
- Install-method detection — the hint names `brew upgrade yt-dlp`; revisit if the tool is shared
- `doctor` command — good idea, separate scope
- Env var for the threshold — a constant is enough until it proves otherwise

## Open Questions
- Should the failure hint also show for non-stale versions ("couldn't download; yt-dlp is current")? Leaning no.
- Where does the startup nudge live: `run()` in src/domain/index.js or downloadTrackList?
- `mp3()` uses stdio: "inherit", so yt-dlp's error text goes straight to the terminal; the hint will print after it, which is fine.
