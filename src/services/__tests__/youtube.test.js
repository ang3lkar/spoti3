import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { fetchPlaylist } from "../youtube.js";

describe("youtube.js services", () => {
  describe("fetchPlaylist", () => {
    it("should fetch and format playlist data", async () => {
      const url = "https://www.youtube.com/playlist?list=PL1234567890";
      const mockPlaylistDetails = {
        name: "My Awesome YouTube Playlist",
        channelTitle: "Music Channel",
        description: "A great playlist",
        itemCount: 2,
      };
      const mockTracks = [
        {
          snippet: {
            title: "Track 1",
            channelTitle: "Artist 1",
            publishedAt: "2023-01-01T00:00:00Z",
            thumbnails: {
              high: { url: "https://example.com/thumb1.jpg" },
            },
          },
          contentDetails: {
            videoId: "video1",
          },
        },
        {
          snippet: {
            title: "Track 2",
            channelTitle: "Artist 2",
            publishedAt: "2023-01-02T00:00:00Z",
            thumbnails: {
              high: { url: "https://example.com/thumb2.jpg" },
            },
          },
          contentDetails: {
            videoId: "video2",
          },
        },
      ];

      const mockedApi = {
        fetchPlaylistDetails: mock.fn(() => mockPlaylistDetails),
        fetchTracks: mock.fn(() => mockTracks),
      };

      const result = await fetchPlaylist(url, {
        youtubeApi: mockedApi,
      });

      // Verify the result
      assert.strictEqual(result.name, "My Awesome YouTube Playlist");
      assert.strictEqual(result.folderName, "My Awesome YouTube Playlist");
      assert.strictEqual(result.tracks.length, 2);
      assert.strictEqual(result.tracks[0].fullTitle, "Artist 1 - Track 1");
      assert.strictEqual(result.tracks[1].fullTitle, "Artist 2 - Track 2");
      assert.strictEqual(result.tracks[0].videoId, "video1");
      assert.strictEqual(result.tracks[1].videoId, "video2");

      // Verify that the mocks were called correctly
      assert.strictEqual(mockedApi.fetchPlaylistDetails.mock.calls.length, 1);
      assert.strictEqual(mockedApi.fetchTracks.mock.calls.length, 1);
    });

    it("should handle video type correctly", async () => {
      const url = "https://www.youtube.com/watch?v=video123";
      const mockVideoDetails = {
        name: "Amazing Song",
        channelTitle: "Great Artist",
        description: "An amazing song",
        itemCount: 1,
        videoId: "video123",
      };
      const mockTracks = [
        {
          snippet: {
            title: "Amazing Song",
            channelTitle: "Great Artist",
            publishedAt: "2023-01-01T00:00:00Z",
            thumbnails: {
              high: { url: "https://example.com/thumb.jpg" },
            },
          },
          contentDetails: {
            videoId: "video123",
          },
        },
      ];

      const mockedApi = {
        fetchPlaylistDetails: mock.fn(() => mockVideoDetails),
        fetchTracks: mock.fn(() => mockTracks),
      };

      const result = await fetchPlaylist(url, {
        youtubeApi: mockedApi,
      });

      // Verify the result
      assert.strictEqual(result.name, "Amazing Song");
      assert.strictEqual(result.folderName, "Great Artist - Amazing Song");
      assert.strictEqual(result.tracks.length, 1);
      assert.strictEqual(
        result.tracks[0].fullTitle,
        "Great Artist - Amazing Song"
      );
      assert.strictEqual(result.tracks[0].videoId, "video123");
    });

    it("should handle API errors", async () => {
      const url = "https://www.youtube.com/playlist?list=error";
      const mockError = new Error("API Error");

      const mockedApi = {
        fetchPlaylistDetails: mock.fn(() => Promise.reject(mockError)),
      };

      // Verify that the error is propagated
      await assert.rejects(
        () => fetchPlaylist(url, { youtubeApi: mockedApi }),
        mockError
      );
    });

    it("should throw error for invalid YouTube URL", async () => {
      const url = "https://invalid-url.com/playlist/123";

      const mockedApi = {
        fetchPlaylistDetails: mock.fn(() => ({})),
        fetchTracks: mock.fn(() => []),
      };

      // Verify that the error is thrown
      await assert.rejects(
        () => fetchPlaylist(url, { youtubeApi: mockedApi }),
        /Invalid YouTube URL/
      );
    });
  });
});
