import { describe, test, before } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import MP3Tag from "mp3tag.js";
import { setTags } from "./index.js";

describe("setTags", () => {
  const artworkPath = `${process.cwd()}/src/tag/cover.jpg`;
  const audioPath = `${process.cwd()}/src/tag/test.mp3`;

  before(async () => {
    const buffer = fs.readFileSync(audioPath);

    const mp3tag = new MP3Tag(buffer, true);

    mp3tag.read();

    mp3tag.tags.title = "";
    mp3tag.tags.artist = "";
    mp3tag.tags.album = "";
    mp3tag.tags.track = "";

    await downloadImage(
      "https://i.scdn.co/image/ab67616d00001e02ff9ca10b55ce82ae553c8228",
      artworkPath,
    );

    // Read artwork's bytes
    const artBuffer = fs.readFileSync(artworkPath);
    const artBytes = new Uint8Array(artBuffer);

    // Image metadata
    mp3tag.tags.v2.APIC = [
      {
        format: "image/jpeg",
        type: 3,
        description: "Album image",
        data: artBytes,
      },
    ];

    mp3tag.save();

    // Handle error if there's any
    if (mp3tag.error !== "") throw new Error(mp3tag.error);

    fs.writeFileSync(audioPath, mp3tag.buffer);
  });

  test("should set ordinal and album", (t) => {
    const expected = {
      title: "Where the names are real",
      artist: "Warhaus",
      album: "No surprise",
      ordinal: "1",
    };

    setTags(audioPath, expected);

    const buffer = fs.readFileSync(audioPath);

    const mp3tag = new MP3Tag(buffer, true);

    const tags = mp3tag.read();

    assert.strictEqual(tags.title, expected.title);
    assert.strictEqual(tags.artist, expected.artist);
    assert.strictEqual(tags.album, expected.album);
    assert.strictEqual(tags.track, expected.ordinal);
  });
});
