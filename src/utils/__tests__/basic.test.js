import { describe, it, mock } from "node:test";
import assert from "node:assert";
import https from "node:https";
import {
  titleToFriendlyName,
  delay,
  downloadImageToMemory,
  getOrdinalString,
  greekToLatin,
} from "../basic.js";

describe("basic.js utilities", () => {
  describe("titleToFriendlyName", () => {
    it("should convert a playlist name to a friendly filename", () => {
      const playlist = {
        id: "123abc",
        name: "My Awesome Playlist! 🎵",
      };

      const result = titleToFriendlyName(playlist);
      assert.strictEqual(result, "My-Awesome-Playlist-123abc");
    });

    it("should handle special characters and emojis", () => {
      const playlist = {
        id: "xyz789",
        name: "🎸 Rock & Roll 🤘 (2024)",
      };

      const result = titleToFriendlyName(playlist);
      assert.strictEqual(result, "-Rock-Roll-2024-xyz789");
    });

    it("should handle empty playlist name", () => {
      const playlist = {
        id: "empty123",
        name: "",
      };

      const result = titleToFriendlyName(playlist);
      assert.strictEqual(result, "-empty123");
    });
  });

  describe("delay", () => {
    it("should delay execution for the specified time", async () => {
      const startTime = Date.now();
      const delayTime = 100;

      await delay(delayTime);

      const endTime = Date.now();
      const elapsedTime = endTime - startTime;

      assert.ok(
        elapsedTime >= delayTime,
        `Expected delay of at least ${delayTime}ms, got ${elapsedTime}ms`
      );
    });
  });

  describe("downloadImageToMemory", () => {
    it("should download an image and return a buffer", async () => {
      // Mock data
      const mockImageData = Buffer.from("fake image data");
      const mockUrl = "https://example.com/image.jpg";

      // Mock the https.get function
      const mockGet = mock.method(https, "get", (url, callback) => {
        // Create a mock response object
        const mockResponse = {
          on: (event, handler) => {
            if (event === "data") {
              handler(mockImageData);
            } else if (event === "end") {
              handler();
            }
          },
        };

        // Call the callback with the mock response
        callback(mockResponse);

        // Return a mock request object
        return {
          on: (_event, _handler) => {
            // No error in this test case
          },
        };
      });

      const result = await downloadImageToMemory(mockUrl);

      // Verify the result
      assert.ok(Buffer.isBuffer(result), "Result should be a Buffer");
      assert.strictEqual(
        result.toString(),
        mockImageData.toString(),
        "Buffer content should match mock data"
      );

      // Verify the mock was called correctly
      assert.strictEqual(
        mockGet.mock.calls.length,
        1,
        "https.get should be called once"
      );
      assert.strictEqual(
        mockGet.mock.calls[0].arguments[0],
        mockUrl,
        "https.get should be called with the correct URL"
      );
    });

    it("should handle HTTP errors", async () => {
      const mockUrl = "https://example.com/error.jpg";
      const mockError = new Error("Network error");

      // Mock the https.get function to simulate an error
      mock.method(https, "get", () => {
        return {
          on: (event, handler) => {
            if (event === "error") {
              handler(mockError);
            }
          },
        };
      });

      // Verify that the function rejects with the error
      await assert.rejects(
        downloadImageToMemory(mockUrl),
        mockError,
        "Function should reject with the network error"
      );
    });
  });

  describe("getOrdinalString", () => {
    it("should return a zero-padded ordinal string", () => {
      assert.strictEqual(getOrdinalString(0, 1), "0");
      assert.strictEqual(getOrdinalString(1, 2), "1");
      assert.strictEqual(getOrdinalString(2, 3), "2");
      assert.strictEqual(getOrdinalString(9, 10), "09");
    });
  });

  describe("greekToLatin", () => {
    it("should transliterate a common word", () => {
      assert.strictEqual(greekToLatin("Ελλάδα"), "Ellada");
    });

    it("should map final sigma to s", () => {
      assert.strictEqual(greekToLatin("Νίκος"), "Nikos");
    });

    it("should keep multi-character mappings fully uppercase in all-caps text", () => {
      assert.strictEqual(greekToLatin("ΘΕΣΣΑΛΟΝΙΚΗ"), "THESSALONIKI");
    });

    it("should title-case multi-character mappings otherwise", () => {
      assert.strictEqual(greekToLatin("Θεσσαλονίκη"), "Thessaloniki");
    });

    it("should handle the ου digraph instead of mapping it letter by letter", () => {
      assert.strictEqual(greekToLatin("Πουλόπουλος"), "Poulopoulos");
    });

    it("should pass through Latin, digits and punctuation untouched", () => {
      assert.strictEqual(
        greekToLatin("Remix - Καλοκαίρι 2024"),
        "Remix - Kalokairi 2024"
      );
    });

    it("should be idempotent", () => {
      const once = greekToLatin("Θεσσαλονίκη - Πουλόπουλος 2024");
      assert.strictEqual(greekToLatin(once), once);
    });

    it("should return non-string input unchanged", () => {
      assert.strictEqual(greekToLatin(null), null);
      assert.strictEqual(greekToLatin(undefined), undefined);
    });

    it("should return empty input unchanged", () => {
      assert.strictEqual(greekToLatin(""), "");
    });

    it("should not leave any Greek codepoints behind", () => {
      const greekRange = /[Ͱ-Ͽἀ-῿]/;
      for (const sample of [
        "Ελλάδα",
        "ΘΕΣΣΑΛΟΝΙΚΗ",
        "Πουλόπουλος",
        "Remix - Καλοκαίρι 2024",
      ]) {
        assert.ok(!greekRange.test(greekToLatin(sample)));
      }
    });
  });
});
