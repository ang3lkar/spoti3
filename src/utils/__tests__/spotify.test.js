// write a test for extractPlaylistId function

import assert from "node:assert";
import { describe, it } from "node:test";
import { extractSpotifyId } from "../spotify.js";

describe("extractSpotifyId", () => {
  it("should extract the playlist id from a Spotify playlist URL", () => {
    const url = "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M";
    const id = extractSpotifyId(url);
    assert.equal(id.type, "playlist");
    assert.equal(id.value, "37i9dQZF1DXcBWIGoYBM5M");
  });

  it("should extract the playlist id from a Spotify album URL", () => {
    const url = "https://open.spotify.com/album/37i9dQZF1DXcBWIGoYBM5M";
    const id = extractSpotifyId(url);
    assert.equal(id.type, "album");
    assert.equal(id.value, "37i9dQZF1DXcBWIGoYBM5M");
  });

  it("should throw an error if the URL is not a Spotify playlist", () => {
    const url = "https://some.url/";
    assert.throws(
      () => extractSpotifyId(url),
      /Invalid Spotify URL/, // Optional: Regex to match the error message
      'Expected function to throw an error with the message "Invalid Spotify URL'
    );
  });
});
