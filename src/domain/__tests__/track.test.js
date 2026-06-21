import { describe, it, after, beforeEach } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { saveTrackTags, remembered } from "../download/track.js";
import { getRepoRoot } from "../../utils/repo.js";

const TEST_FOLDER = "__spoti3_track_test__";
const playlistFolder = path.join(getRepoRoot(), "downloads", TEST_FOLDER);
const playlist = { folderName: TEST_FOLDER, name: TEST_FOLDER };

function ytTrack(fullTitle, artist, title) {
  return { videoId: "vid123", fullTitle, artist, title, tagSource: "youtube", thumbnails: null };
}

function spotifyTrack(fullTitle, artistName, title) {
  return { fullTitle, name: title, artists: [{ name: artistName }], album: { name: "Album" } };
}

function touch(filename) {
  fs.writeFileSync(path.join(playlistFolder, filename), "");
}

function exists(filename) {
  return fs.existsSync(path.join(playlistFolder, filename));
}

describe("saveTrackTags", () => {
  fs.mkdirSync(playlistFolder, { recursive: true });

  after(() => {
    fs.rmSync(playlistFolder, { recursive: true, force: true });
  });

  beforeEach(() => {
    remembered.artist = null;
    remembered.thumbnail = null;
  });

  it("renames the file when confirmed artist differs from fullTitle", async () => {
    // #given — fullTitle is stale; artist field holds the corrected value
    const track = ytTrack("WrongArtist - Blue", "CorrectArtist", "Blue");
    touch("WrongArtist - Blue.mp3");

    // #when
    await saveTrackTags(track, playlist, { ordinal: 1 }, null);

    // #then
    assert.ok(exists("CorrectArtist - Blue.mp3"), "renamed file should exist");
    assert.ok(!exists("WrongArtist - Blue.mp3"), "original file should be gone");
  });

  it("does not rename when confirmed values already match fullTitle", async () => {
    // #given
    const track = ytTrack("Artist - Song", "Artist", "Song");
    touch("Artist - Song.mp3");

    // #when
    await saveTrackTags(track, playlist, { ordinal: 1 }, null);

    // #then
    assert.ok(exists("Artist - Song.mp3"), "file should remain unchanged");
  });

  it("does not rename Spotify tracks", async () => {
    // #given — no videoId → Spotify track
    const track = spotifyTrack("01. Artist - Song", "Artist", "Song");
    touch("01. Artist - Song.mp3");

    // #when
    await saveTrackTags(track, playlist, { ordinal: 1 }, null);

    // #then
    assert.ok(exists("01. Artist - Song.mp3"), "Spotify file should not be renamed");
  });

  it("skips thumbnail when remembered.thumbnail is false", async () => {
    // #given
    const track = ytTrack("Artist - Song", "Artist", "Song");
    touch("Artist - Song.mp3");
    remembered.thumbnail = false;
    const artBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]); // non-empty bytes

    // #when — should complete without error; artBytes is nulled before setTags
    await saveTrackTags(track, playlist, { ordinal: 1 }, artBytes);

    // #then — file untouched (thumbnail decision doesn't affect filename)
    assert.ok(exists("Artist - Song.mp3"));
  });

  it("accepts thumbnail when remembered.thumbnail is true", async () => {
    // #given
    const track = ytTrack("Artist - Song2", "Artist", "Song2");
    touch("Artist - Song2.mp3");
    remembered.thumbnail = true;
    const artBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

    // #when
    await saveTrackTags(track, playlist, { ordinal: 2 }, artBytes);

    // #then — file untouched
    assert.ok(exists("Artist - Song2.mp3"));
  });
});
