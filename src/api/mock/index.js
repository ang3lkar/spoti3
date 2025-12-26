export async function fetchPlaylist({ youtubeId: _youtubeId }) {
  try {
    return {
      name: "Mock Playlist",
      channelTitle: "Music Channel",
      folderName: "Mock Playlist",
      description: "This is a mock playlist",
      publishedAt: "2021-01-01T00:00:00Z",
      thumbnails: {
        high: { url: "https://example.com/thumb1.jpg" },
      },
      itemCount: 2,
      playlistId: "1234567890",
      tracks: [
        {
          id: "1234567890",
          name: "Track 1",
          fullTitle: "Artist 1 - Track 1",
          artists: ["Artist 1"],
        },
      ],
    };
  } catch (err) {
    throw err;
  }
}
