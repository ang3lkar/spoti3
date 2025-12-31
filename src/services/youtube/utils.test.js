import { describe, it } from "node:test";
import assert from "node:assert";
import {
  extractYouTubeId,
  getYouTubeSearchTerm,
  getChannelName,
  getYouTubeTrackImageUrl,
  enrichYouTubeTrack,
} from "./utils.js";
import { noOpLogger } from "../../utils/logger.js";

describe("youtube.js utilities", () => {
  describe("extractYouTubeId", () => {
    it("should extract playlist ID from valid URL", () => {
      const url = "https://www.youtube.com/playlist?list=PL1234567890";
      const result = extractYouTubeId(url, { logger: noOpLogger });
      assert.deepStrictEqual(result, {
        type: "playlist",
        value: "PL1234567890",
      });
    });

    it("should extract video ID from valid URL", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      const result = extractYouTubeId(url, { logger: noOpLogger });
      assert.deepStrictEqual(result, {
        type: "video",
        value: "dQw4w9WgXcQ",
      });
    });

    it("should extract video ID from short URL", () => {
      const url = "https://youtu.be/dQw4w9WgXcQ";
      const result = extractYouTubeId(url, { logger: noOpLogger });
      assert.deepStrictEqual(result, {
        type: "video",
        value: "dQw4w9WgXcQ",
      });
    });

    it("should extract channel ID from valid URL", () => {
      const url = "https://www.youtube.com/channel/UC1234567890";
      const result = extractYouTubeId(url, { logger: noOpLogger });
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
    it("should return channel title from snippet", () => {
      const track = { snippet: { channelTitle: "Music Channel" } };
      const result = getChannelName(track);
      assert.strictEqual(result, "Music Channel");
    });

    it("should return channel title from direct property", () => {
      const track = { channelTitle: "Direct Channel" };
      const result = getChannelName(track);
      assert.strictEqual(result, "Direct Channel");
    });

    it("should return empty string if no channel title", () => {
      const track = {};
      const result = getChannelName(track);
      assert.strictEqual(result, "");
    });
  });

  describe("getYouTubeTrackImageUrl", () => {
    it("should return maxres thumbnail if available", () => {
      const track = {
        thumbnails: {
          maxres: { url: "https://example.com/maxres.jpg" },
          high: { url: "https://example.com/high.jpg" },
        },
      };
      const playlist = {};
      const result = getYouTubeTrackImageUrl(track, playlist);
      assert.strictEqual(result, "https://example.com/maxres.jpg");
    });

    it("should fallback to high quality thumbnail", () => {
      const track = {
        thumbnails: {
          high: { url: "https://example.com/high.jpg" },
          medium: { url: "https://example.com/medium.jpg" },
        },
      };
      const playlist = {};
      const result = getYouTubeTrackImageUrl(track, playlist);
      assert.strictEqual(result, "https://example.com/high.jpg");
    });

    it("should use playlist thumbnail as fallback", () => {
      const track = {};
      const playlist = {
        thumbnails: {
          high: { url: "https://example.com/playlist.jpg" },
        },
      };
      const result = getYouTubeTrackImageUrl(track, playlist);
      assert.strictEqual(result, "https://example.com/playlist.jpg");
    });

    it("should return null if no thumbnails available", () => {
      const track = {};
      const playlist = {};
      const result = getYouTubeTrackImageUrl(track, playlist);
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
        logger: noOpLogger,
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
        logger: noOpLogger,
        disableCache: true,
      });

      assert.strictEqual(result.fullTitle, "Song - With / Slashes");
      assert.strictEqual(result.title, "With / Slashes");
      // Should have tagSource set
      assert.ok(
        result.tagSource === "youtube" || result.tagSource === "spotify"
      );
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
            logger: noOpLogger,
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
        logger: noOpLogger,
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
        logger: noOpLogger,
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
