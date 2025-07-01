import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { fetchPlaylist } from "../spotify.js";

describe("spotify.js services", () => {
  describe("fetchPlaylist", () => {
    it("should fetch and format playlist data", async () => {
      const url = "https://open.spotify.com/playlist/123";
      const mockPlaylistDetails = {
        name: "My Awesome Playlist",
        artists: [{ name: "Various Artists" }],
      };
      const mockTracks = [
        {
          track: {
            name: "Track 1",
            artists: [{ name: "Artist 1" }],
          },
        },
        {
          track: {
            name: "Track 2",
            artists: [{ name: "Artist 2" }, { name: "Artist 3" }],
          },
        },
      ];

      const mockedApi = {
        fetchAccessToken: mock.fn(() => Promise.resolve("mock-token")),
        fetchPlaylistDetails: mock.fn(() => mockPlaylistDetails),
        fetchTracks: mock.fn(() => mockTracks),
      };

      const result = await fetchPlaylist(url, {
        spotifyApi: mockedApi,
      });

      // Verify the result
      assert.strictEqual(result.name, "My Awesome Playlist");
      assert.strictEqual(result.folderName, "My Awesome Playlist");
      assert.strictEqual(result.tracks.length, 2);
      assert.strictEqual(result.tracks[0].fullTitle, "1. Artist 1 - Track 1");
      assert.strictEqual(
        result.tracks[1].fullTitle,
        "2. Artist 2, Artist 3 - Track 2"
      );

      // Verify that the mocks were called correctly
      assert.strictEqual(mockedApi.fetchAccessToken.mock.calls.length, 1);
      assert.strictEqual(mockedApi.fetchPlaylistDetails.mock.calls.length, 1);
      assert.strictEqual(mockedApi.fetchTracks.mock.calls.length, 1);
    });

    it("should handle album type correctly", async () => {
      const mockAccessToken = "mock-token";
      const url = "https://open.spotify.com/album/456";
      const mockAlbumDetails = {
        name: "Greatest Hits",
        artists: [{ name: "Queen" }],
      };
      const mockTracks = [
        {
          name: "Bohemian Rhapsody",
          artists: [{ name: "Queen" }],
        },
        {
          name: "We Will Rock You",
          artists: [{ name: "Queen" }],
        },
      ];

      const mockedApi = {
        fetchAccessToken: mock.fn(() => Promise.resolve(mockAccessToken)),
        fetchPlaylistDetails: mock.fn(() => mockAlbumDetails),
        fetchTracks: mock.fn(() => mockTracks),
      };

      const result = await fetchPlaylist(url, {
        spotifyApi: mockedApi,
      });

      // Verify the result
      assert.strictEqual(result.name, "Greatest Hits");
      assert.strictEqual(result.folderName, "Queen - Greatest Hits");
      assert.strictEqual(result.tracks.length, 2);
      assert.strictEqual(
        result.tracks[0].fullTitle,
        "1. Queen - Bohemian Rhapsody"
      );
      assert.strictEqual(
        result.tracks[1].fullTitle,
        "2. Queen - We Will Rock You"
      );
    });

    it("should handle track type correctly", async () => {
      const mockAccessToken = "mock-token";
      const url = "https://open.spotify.com/track/789";
      const mockTrackDetails = {
        name: "Under Pressure",
        artists: [{ name: "Queen" }, { name: "David Bowie" }],
      };
      const mockTracks = [mockTrackDetails];

      const mockedApi = {
        fetchAccessToken: mock.fn(() => Promise.resolve(mockAccessToken)),
        fetchPlaylistDetails: mock.fn(() => mockTrackDetails),
        fetchTracks: mock.fn(() => mockTracks),
      };

      const result = await fetchPlaylist(url, {
        spotifyApi: mockedApi,
      });

      // Verify the result
      assert.strictEqual(result.name, "Under Pressure");
      assert.strictEqual(result.folderName, "Misc");
      assert.strictEqual(result.tracks.length, 1);
      assert.strictEqual(
        result.tracks[0].fullTitle,
        "Queen, David Bowie - Under Pressure"
      );
    });

    it("should handle API errors", async () => {
      const url = "https://open.spotify.com/playlist/error";
      const mockError = new Error("API Error");

      const mockedApi = {
        fetchAccessToken: mock.fn(() => Promise.reject(mockError)),
      };

      // Verify that the error is propagated
      await assert.rejects(
        () => fetchPlaylist(url, { spotifyApi: mockedApi }),
        mockError
      );
    });

    it("should throw error for unknown Spotify ID type", async () => {
      const mockAccessToken = "mock-token";
      const url = "https://open.spotify.com/unknown/123";
      const mockDetails = { name: "Test" };

      const mockedApi = {
        fetchAccessToken: mock.fn(() => Promise.resolve(mockAccessToken)),
        fetchPlaylistDetails: mock.fn(() => mockDetails),
        fetchTracks: mock.fn(() => []),
      };

      // Verify that the error is thrown
      await assert.rejects(
        () => fetchPlaylist(url, { spotifyApi: mockedApi }),
        /Invalid Spotify URL/
      );
    });
  });
});
