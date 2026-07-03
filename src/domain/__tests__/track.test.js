import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import {
  getFinalFullTitle,
  promptForTrackMetadata,
  remembered,
} from "../download/track.js";
import { logger } from "../../utils/logger.js";

function ytTrack(fullTitle, artist, title) {
  return { videoId: "vid123", fullTitle, artist, title, tagSource: "youtube", thumbnails: null };
}

function spotifyTrack(fullTitle, artistName, title) {
  return { fullTitle, name: title, artists: [{ name: artistName }], album: { name: "Album" } };
}

describe("getFinalFullTitle", () => {
  it("uses the confirmed artist and title for YouTube tracks", () => {
    // #given — fullTitle is stale; confirmed values hold the correction
    const track = ytTrack("WrongArtist - Blue", "CorrectArtist", "Blue");

    // #when
    const result = getFinalFullTitle(track, { artist: "CorrectArtist", title: "Blue" });

    // #then
    assert.strictEqual(result, "CorrectArtist - Blue");
  });

  it("keeps the ordinal-prefixed fullTitle for Spotify tracks", () => {
    // #given — no videoId → Spotify track
    const track = spotifyTrack("01. Artist - Song", "Artist", "Song");

    // #when
    const result = getFinalFullTitle(track, { artist: "Artist", title: "Song" });

    // #then
    assert.strictEqual(result, "01. Artist - Song");
  });
});

describe("promptForTrackMetadata", () => {
  beforeEach(() => {
    remembered.artist = null;
    remembered.thumbnail = null;
    remembered.thumbnailBytes = null;
    // Accept every prompt with its default — no TTY in the test runner
    mock.method(logger, "prompt", async () => undefined);
  });

  it("drops the thumbnail when remembered.thumbnail is false", async () => {
    // #given
    const track = ytTrack("Artist - Song", "Artist", "Song");
    remembered.thumbnail = false;
    const artBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

    // #when
    const result = await promptForTrackMetadata(
      track,
      { artist: "Artist", title: "Song", tagSource: "youtube" },
      artBytes
    );

    // #then
    assert.strictEqual(result.artBytes, null);
  });

  it("keeps the thumbnail when remembered.thumbnail is true", async () => {
    // #given
    const track = ytTrack("Artist - Song", "Artist", "Song");
    remembered.thumbnail = true;
    const artBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

    // #when
    const result = await promptForTrackMetadata(
      track,
      { artist: "Artist", title: "Song", tagSource: "youtube" },
      artBytes
    );

    // #then
    assert.strictEqual(result.artBytes, artBytes);
  });

  it("does not prompt for Spotify tracks", async () => {
    // #given — no videoId → Spotify track
    const track = spotifyTrack("01. Artist - Song", "Artist", "Song");

    // #when
    const result = await promptForTrackMetadata(
      track,
      { artist: "Artist", title: "Song", tagSource: "spotify" },
      null
    );

    // #then
    assert.strictEqual(logger.prompt.mock.callCount(), 0);
    assert.deepStrictEqual(result, { artist: "Artist", title: "Song", artBytes: null });
  });

  it("returns calculated metadata without prompting in yolo mode", async () => {
    // #given
    const track = ytTrack("Artist - Song", "Artist", "Song");
    const artBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

    // #when
    const result = await promptForTrackMetadata(
      track,
      { artist: "Artist", title: "Song", tagSource: "youtube" },
      artBytes,
      { yolo: true }
    );

    // #then
    assert.strictEqual(logger.prompt.mock.callCount(), 0);
    assert.deepStrictEqual(result, { artist: "Artist", title: "Song", artBytes });
  });

  it("still prompts for YouTube tracks when yolo is not set", async () => {
    // #given
    const track = ytTrack("Artist - Song", "Artist", "Song");
    const artBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

    // #when
    await promptForTrackMetadata(
      track,
      { artist: "Artist", title: "Song", tagSource: "youtube" },
      artBytes
    );

    // #then
    assert.ok(logger.prompt.mock.callCount() > 0);
  });
});
