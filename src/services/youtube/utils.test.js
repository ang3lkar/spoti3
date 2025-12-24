import { describe, it } from "node:test";
import assert from "node:assert";
import {
  extractYouTubeId,
  getYouTubeSearchTerm,
  getChannelName,
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

    it("should extract track ID and playlist ID from valid URL", () => {
      const url =
        "https://www.youtube.com/watch?v=njwi8lK0jzU&list=RDnjwi8lK0jzU&start_radio=1&ab_channel=ANATOLIANPRODUCTION";
      const result = extractYouTubeId(url);
      assert.deepStrictEqual(result, {
        type: "video",
        value: "njwi8lK0jzU",
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
    it("should enrich track with full title and video ID", () => {
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

      const result = enrichYouTubeTrack(item);

      assert.strictEqual(result.fullTitle, "Great Artist - Amazing Song");
      assert.strictEqual(result.title, "Amazing Song");
      assert.strictEqual(result.channelTitle, "Great Artist");
      assert.strictEqual(result.videoId, undefined);
      assert.strictEqual(result.publishedAt, "2023-01-01T00:00:00Z");
    });

    it("should replace forward slashes in title", () => {
      const item = {
        snippet: {
          title: "Song / With / Slashes",
          channelTitle: "Artist",
        },
        contentDetails: {
          videoId: "video123",
        },
      };

      const result = enrichYouTubeTrack(item);

      assert.strictEqual(result.fullTitle, "Song - With / Slashes");
      assert.strictEqual(result.title, "With / Slashes");
    });

    it("should handle track without channel title", () => {
      const item = {
        snippet: {
          title: "Song Without Artist",
        },
        contentDetails: {
          videoId: "video123",
        },
      };

      assert.throws(() => enrichYouTubeTrack(item), TypeError);
    });
  });
});
