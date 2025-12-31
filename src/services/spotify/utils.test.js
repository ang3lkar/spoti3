import { describe, it } from "node:test";
import assert from "node:assert";
import {
  extractSpotifyId,
  getSearchTerm,
  getTrackImageUrl,
  getArtists,
} from "./utils.js";
describe("spotify.js utilities", () => {
  describe("extractSpotifyId", () => {
    it("should extract playlist ID from valid URL", () => {
      const url = "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M";
      const result = extractSpotifyId(url);
      assert.deepStrictEqual(result, {
        type: "playlist",
        value: "37i9dQZF1DXcBWIGoYBM5M",
      });
    });

    it("should extract album ID from valid URL", () => {
      const url = "https://open.spotify.com/album/6kf46HbnYCZzP6rjvQHYzg";
      const result = extractSpotifyId(url);
      assert.deepStrictEqual(result, {
        type: "album",
        value: "6kf46HbnYCZzP6rjvQHYzg",
      });
    });

    it("should extract track ID from valid URL", () => {
      const url = "https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6";
      const result = extractSpotifyId(url);
      assert.deepStrictEqual(result, {
        type: "track",
        value: "6rqhFgbbKwnb9MLmUQDhG6",
      });
    });

    it("should throw error for invalid URL", () => {
      const url = "https://open.spotify.com/invalid/123";
      assert.throws(() => extractSpotifyId(url), Error, "Invalid Spotify URL");
    });

    it("should handle URLs with additional path segments", () => {
      const url =
        "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=123";
      const result = extractSpotifyId(url);
      assert.deepStrictEqual(result, {
        type: "playlist",
        value: "37i9dQZF1DXcBWIGoYBM5M",
      });
    });
  });

  describe("getSearchTerm", () => {
    it("should return track title for non-album playlist", () => {
      const track = {
        fullTitle: "01. Bohemian Rhapsody",
        searchTitle: "Bohemian Rhapsody",
      };
      const playlist = {
        album_type: "playlist",
        name: "My Playlist",
      };

      const result = getSearchTerm(track, playlist);
      assert.strictEqual(result, "Bohemian Rhapsody");
    });

    it("should concatenate track title and album name for album type", () => {
      const track = {
        fullTitle: "01. Bohemian Rhapsody",
        searchTitle: "Bohemian Rhapsody",
      };
      const playlist = {
        album_type: "album",
        name: "A Night at the Opera",
      };

      const result = getSearchTerm(track, playlist);
      assert.strictEqual(result, "Bohemian Rhapsody - A Night at the Opera");
    });
  });

  describe("getTrackImageUrl", () => {
    it("should return track album image when available", () => {
      const track = {
        album: {
          images: [{ url: "https://track-image.com" }],
        },
      };
      const playlist = {
        images: [{ url: "https://playlist-image.com" }],
      };

      const result = getTrackImageUrl(track, playlist);
      assert.strictEqual(result, "https://track-image.com");
    });

    it("should return playlist image when track album image is not available", () => {
      const track = {
        album: null,
      };
      const playlist = {
        images: [{ url: "https://playlist-image.com" }],
      };

      const result = getTrackImageUrl(track, playlist);
      assert.strictEqual(result, "https://playlist-image.com");
    });
  });

  describe("getArtists", () => {
    it("should return single artist name", () => {
      const track = {
        artists: [{ name: "Queen" }],
      };

      const result = getArtists(track);
      assert.strictEqual(result, "Queen");
    });

    it("should return comma-separated list of multiple artists", () => {
      const track = {
        artists: [
          { name: "Queen" },
          { name: "David Bowie" },
          { name: "Annie Lennox" },
        ],
      };

      const result = getArtists(track);
      assert.strictEqual(result, "Queen, David Bowie, Annie Lennox");
    });

    it("should handle empty artists array", () => {
      const track = {
        artists: [],
      };

      const result = getArtists(track);
      assert.strictEqual(result, "");
    });

    it("should handle missing artists property", () => {
      const track = {};

      const result = getArtists(track);
      assert.strictEqual(result, "");
    });
  });
});
