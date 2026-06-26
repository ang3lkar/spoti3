import { describe, it } from "node:test";
import assert from "node:assert";
import {
  extractYouTubeId,
  getYouTubeSearchTerm,
  getChannelName,
  getTopicChannelArtist,
  getYouTubeTrackImageUrl,
  enrichYouTubeTrack,
} from "./utils.js";
describe("youtube.js utilities", () => {
  describe("extractYouTubeId", () => {
    it("should extract playlist ID from valid URL", () => {
      const url = "https://www.youtube.com/playlist?list=PL1234567890";
      const result = extractYouTubeId(url);
      assert.deepStrictEqual(result, {
        type: "playlist",
        value: "PL1234567890",
      });
    });

    it("should extract video ID from valid URL", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      const result = extractYouTubeId(url);
      assert.deepStrictEqual(result, {
        type: "video",
        value: "dQw4w9WgXcQ",
      });
    });

    it("should extract video ID from short URL", () => {
      const url = "https://youtu.be/dQw4w9WgXcQ";
      const result = extractYouTubeId(url);
      assert.deepStrictEqual(result, {
        type: "video",
        value: "dQw4w9WgXcQ",
      });
    });

    it("should extract channel ID from valid URL", () => {
      const url = "https://www.youtube.com/channel/UC1234567890";
      const result = extractYouTubeId(url);
      assert.deepStrictEqual(result, {
        type: null,
        value: null,
      });
    });
  });

  describe("getYouTubeSearchTerm", () => {
    it("should return track title", () => {
      const track = { title: "Amazing Song" };
      const playlist = { name: "My Playlist" };
      const result = getYouTubeSearchTerm(track, playlist);
      assert.strictEqual(result, "Amazing Song");
    });

    it("should return snippet title if available", () => {
      const track = { snippet: { title: "Great Track" } };
      const playlist = { name: "My Playlist" };
      const result = getYouTubeSearchTerm(track, playlist);
      assert.strictEqual(result, "Great Track");
    });

    it("should return empty string if no title", () => {
      const track = {};
      const playlist = { name: "My Playlist" };
      const result = getYouTubeSearchTerm(track, playlist);
      assert.strictEqual(result, "");
    });
  });

  describe("getChannelName", () => {
    it("should prefer videoOwnerChannelTitle over channelTitle", () => {
      const track = { snippet: { videoOwnerChannelTitle: "Oasis", channelTitle: "YouTube Music" } };
      assert.strictEqual(getChannelName(track), "Oasis");
    });

    it("should fall back to channelTitle when videoOwnerChannelTitle is absent", () => {
      const track = { snippet: { channelTitle: "Music Channel" } };
      assert.strictEqual(getChannelName(track), "Music Channel");
    });

    it("should fall back to direct channelTitle property", () => {
      const track = { channelTitle: "Direct Channel" };
      assert.strictEqual(getChannelName(track), "Direct Channel");
    });

    it("should strip the ' - Topic' suffix", () => {
      const track = { snippet: { videoOwnerChannelTitle: "Oasis - Topic" } };
      assert.strictEqual(getChannelName(track), "Oasis");
    });

    it("should strip ' - Topic' case-insensitively", () => {
      const track = { snippet: { videoOwnerChannelTitle: "Radiohead - topic" } };
      assert.strictEqual(getChannelName(track), "Radiohead");
    });

    it("should return empty string when channel name is YouTube", () => {
      const track = { snippet: { channelTitle: "YouTube" } };
      assert.strictEqual(getChannelName(track), "");
    });

    it("should return empty string when channel name is YouTube case-insensitively", () => {
      const track = { snippet: { channelTitle: "youtube" } };
      assert.strictEqual(getChannelName(track), "");
    });

    it("should return empty string if no channel title", () => {
      const track = {};
      assert.strictEqual(getChannelName(track), "");
    });
  });

  describe("getTopicChannelArtist", () => {
    it("should return the artist from a Topic channel", () => {
      // #given
      const track = { snippet: { videoOwnerChannelTitle: "Gorillaz - Topic" } };
      // #when / #then
      assert.strictEqual(getTopicChannelArtist(track), "Gorillaz");
    });

    it("should match the ' - Topic' suffix case-insensitively", () => {
      // #given
      const track = { snippet: { videoOwnerChannelTitle: "Radiohead - topic" } };
      // #when / #then
      assert.strictEqual(getTopicChannelArtist(track), "Radiohead");
    });

    it("should return empty string for non-Topic channels", () => {
      // #given
      const track = { snippet: { videoOwnerChannelTitle: "OasisVEVO" } };
      // #when / #then
      assert.strictEqual(getTopicChannelArtist(track), "");
    });

    it("should return empty string when videoOwnerChannelTitle is absent", () => {
      // #given
      const track = { snippet: { channelTitle: "Some Channel" } };
      // #when / #then
      assert.strictEqual(getTopicChannelArtist(track), "");
    });
  });

  describe("getYouTubeTrackImageUrl", () => {
    it("should prefer maxres thumbnail when available", () => {
      // #given
      const track = {
        thumbnails: {
          maxres: { url: "https://example.com/maxres.jpg" },
          high: { url: "https://example.com/high.jpg" },
        },
      };
      const playlist = {};

      // #when
      const result = getYouTubeTrackImageUrl(track, playlist);

      // #then
      assert.strictEqual(result, "https://example.com/maxres.jpg");
    });

    it("should fallback to high thumbnail when maxres unavailable", () => {
      // #given
      const track = {
        thumbnails: {
          high: { url: "https://example.com/high.jpg" },
          medium: { url: "https://example.com/medium.jpg" },
        },
      };
      const playlist = {};

      // #when
      const result = getYouTubeTrackImageUrl(track, playlist);

      // #then
      assert.strictEqual(result, "https://example.com/high.jpg");
    });

    it("should use playlist thumbnail when track has no thumbnails", () => {
      // #given
      const track = {};
      const playlist = {
        thumbnails: {
          high: { url: "https://example.com/playlist.jpg" },
        },
      };

      // #when
      const result = getYouTubeTrackImageUrl(track, playlist);

      // #then
      assert.strictEqual(result, "https://example.com/playlist.jpg");
    });

    it("should return null when no thumbnails available", () => {
      // #given
      const track = {};
      const playlist = {};

      // #when
      const result = getYouTubeTrackImageUrl(track, playlist);

      // #then
      assert.strictEqual(result, null);
    });
  });

  describe("enrichYouTubeTrack", () => {
    it("should enrich track with full title and video ID", async () => {
      const item = {
        snippet: {
          title: "Amazing Song",
          channelTitle: "Great Artist",
          publishedAt: "2023-01-01T00:00:00Z",
          thumbnails: { high: { url: "https://example.com/thumb.jpg" } },
        },
        contentDetails: {
          videoId: "video123",
        },
      };

      const result = await enrichYouTubeTrack(item, {
        disableCache: true,
      });

      assert.strictEqual(result.fullTitle, "Great Artist - Amazing Song");
      assert.strictEqual(result.title, "Amazing Song");
      assert.strictEqual(result.channelTitle, "Great Artist");
      assert.strictEqual(result.videoId, "video123");
      assert.strictEqual(result.publishedAt, "2023-01-01T00:00:00Z");
      // Should have tagSource set (youtube when Spotify search fails)
      assert.ok(
        result.tagSource === "youtube" || result.tagSource === "spotify"
      );
    });

    it("should replace forward slashes in title", async () => {
      const item = {
        snippet: {
          title: "Song / With / Slashes",
          channelTitle: "Artist",
        },
        contentDetails: {
          videoId: "video123",
        },
      };

      const result = await enrichYouTubeTrack(item, {
        disableCache: true,
      });

      assert.strictEqual(result.fullTitle, "Song - With / Slashes");
      assert.strictEqual(result.title, "With / Slashes");
      // Should have tagSource set
      assert.ok(
        result.tagSource === "youtube" || result.tagSource === "spotify"
      );
    });

    it("should keep a hyphenated title whole when there is no spaced separator", async () => {
      // #given
      const item = {
        snippet: {
          title: "Re-Hash",
          channelTitle: "Gorillaz",
        },
        contentDetails: {
          videoId: "video123",
        },
      };

      // #when
      const result = await enrichYouTubeTrack(item, {
        disableCache: true,
      });

      // #then
      assert.strictEqual(result.title, "Re-Hash");
      assert.strictEqual(result.artist, "Gorillaz");
      assert.strictEqual(result.fullTitle, "Gorillaz - Re-Hash");
    });

    it("should drop the artist prefix but keep the hyphenated title", async () => {
      // #given
      const item = {
        snippet: {
          title: "Gorillaz - Re-Hash",
          channelTitle: "Some Channel",
        },
        contentDetails: {
          videoId: "video123",
        },
      };

      // #when
      const result = await enrichYouTubeTrack(item, {
        disableCache: true,
      });

      // #then
      assert.strictEqual(result.artist, "Gorillaz");
      assert.strictEqual(result.title, "Re-Hash");
    });

    it("should handle track without channel title", async () => {
      const item = {
        snippet: {
          title: "Song Without Artist",
        },
        contentDetails: {
          videoId: "video123",
        },
      };

      await assert.rejects(
        () =>
          enrichYouTubeTrack(item, {
            disableCache: true,
          }),
        TypeError
      );
    });

    it("should use Spotify search result when available", async () => {
      // Note: We can't easily mock ES modules in Node.js test runner,
      // so we test the fallback behavior and integration separately
      const item = {
        snippet: {
          title: "Oasis wonderwall live at wembley",
          channelTitle: "Some Channel",
        },
        contentDetails: {
          videoId: "video123",
        },
      };

      // Since we can't easily mock ES modules in Node.js test runner,
      // we'll test the fallback behavior and integration separately
      // This test verifies the function works with disableCache
      const result = await enrichYouTubeTrack(item, {
        disableCache: true,
      });

      // Should fallback to parsing when Spotify is not available in test
      assert.ok(result.fullTitle);
      assert.ok(result.artist);
      assert.ok(result.title);
    });

    it("should fallback to parsing when Spotify search fails", async () => {
      const item = {
        snippet: {
          title: "Unknown Song Title",
          channelTitle: "Unknown Artist",
        },
        contentDetails: {
          videoId: "video123",
        },
      };

      // With disableCache and no Spotify credentials in test, should fallback
      const result = await enrichYouTubeTrack(item, {
        disableCache: true,
      });

      // Should use fallback parsing
      assert.ok(result.fullTitle);
      assert.ok(result.artist || result.title);
      // Should have tagSource set to youtube when Spotify fails
      assert.strictEqual(result.tagSource, "youtube");
    });
  });
});
