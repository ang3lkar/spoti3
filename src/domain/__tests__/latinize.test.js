import { describe, it, after } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import MP3Tag from "mp3tag.js";
import { latinize, latinizeDirectory } from "../latinize/index.js";
import { setTags, latinizeTags } from "../tag/index.js";

describe("latinize", () => {
  it("transliterates a Greek-only string", () => {
    // #given
    const text = "Νίκος";

    // #when
    const result = latinize(text);

    // #then
    assert.strictEqual(result, "Nikos");
  });

  it("leaves a non-Greek accented string byte-identical", () => {
    // #given — Björk / Jóga carry Latin accents, not Greek characters
    const text = "Björk - Jóga";

    // #when
    const result = latinize(text);

    // #then
    assert.strictEqual(result, text);
  });

  it("converts Greek and preserves Latin accents in a mixed string", () => {
    // #given
    const text = "Café — Νίκος";

    // #when
    const result = latinize(text);

    // #then
    assert.strictEqual(result, "Café — Nikos");
  });

  it("leaves a string with no Greek characters untouched", () => {
    // #given
    const text = "Cafe del Mar";

    // #when
    const result = latinize(text);

    // #then
    assert.strictEqual(result, text);
  });
});

describe("latinizeDirectory", () => {
  const tmpDirs = [];

  function makeTmpDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "spoti3-latinize-"));
    tmpDirs.push(dir);
    return dir;
  }

  after(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws a clear error when the directory does not exist", () => {
    // #given
    const missing = path.join(os.tmpdir(), "spoti3-latinize-does-not-exist");

    // #when / #then
    assert.throws(() => latinizeDirectory({ dir: missing }), /not a valid directory/);
  });

  it("renames a Greek-named file", () => {
    // #given
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, "Τραγούδι.txt"), "content");

    // #when
    const summary = latinizeDirectory({ dir, options: {} });

    // #then
    assert.strictEqual(summary.filesRenamed, 1);
    assert.ok(fs.existsSync(path.join(dir, "Tragoudi.txt")));
    assert.ok(!fs.existsSync(path.join(dir, "Τραγούδι.txt")));
  });

  it("leaves a non-Greek accented filename untouched", () => {
    // #given
    const dir = makeTmpDir();
    const fileName = "Björk - Jóga.mp3";
    fs.writeFileSync(path.join(dir, fileName), "content");

    // #when
    const summary = latinizeDirectory({ dir, options: {} });

    // #then
    assert.strictEqual(summary.filesRenamed, 0);
    assert.ok(fs.existsSync(path.join(dir, fileName)));
  });

  it("renames a nested Greek folder and the Greek file inside it, bottom-up", () => {
    // #given
    const dir = makeTmpDir();
    const nestedDir = path.join(dir, "Ελληνικά");
    fs.mkdirSync(nestedDir);
    fs.writeFileSync(path.join(nestedDir, "Νίκος.txt"), "content");

    // #when
    const summary = latinizeDirectory({ dir, options: {} });

    // #then
    assert.strictEqual(summary.foldersRenamed, 1);
    assert.strictEqual(summary.filesRenamed, 1);
    const renamedDir = path.join(dir, "Ellinika");
    assert.ok(fs.existsSync(renamedDir));
    assert.ok(fs.existsSync(path.join(renamedDir, "Nikos.txt")));
  });

  it("skips a rename when the target already exists and reports a conflict", () => {
    // #given
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, "Νίκος.txt"), "greek");
    fs.writeFileSync(path.join(dir, "Nikos.txt"), "already here");

    // #when
    const summary = latinizeDirectory({ dir, options: {} });

    // #then
    assert.strictEqual(summary.conflicts, 1);
    assert.strictEqual(summary.filesRenamed, 0);
    assert.strictEqual(
      fs.readFileSync(path.join(dir, "Νίκος.txt"), "utf8"),
      "greek"
    );
    assert.strictEqual(
      fs.readFileSync(path.join(dir, "Nikos.txt"), "utf8"),
      "already here"
    );
  });

  it("mutates nothing under --dry-run", () => {
    // #given
    const dir = makeTmpDir();
    const nestedDir = path.join(dir, "Ελληνικά");
    fs.mkdirSync(nestedDir);
    fs.writeFileSync(path.join(nestedDir, "Νίκος.txt"), "content");

    // #when
    const summary = latinizeDirectory({ dir, options: { dryRun: true } });

    // #then — plan reports the changes, but nothing on disk moved
    assert.strictEqual(summary.foldersRenamed, 1);
    assert.strictEqual(summary.filesRenamed, 1);
    assert.ok(fs.existsSync(nestedDir));
    assert.ok(fs.existsSync(path.join(nestedDir, "Νίκος.txt")));
    assert.ok(!fs.existsSync(path.join(dir, "Ellinika")));
  });
});

describe("latinizeTags", () => {
  const tmpDirs = [];
  const fixture = path.join(
    process.cwd(),
    "downloads/Misc/Giorgos Mazonakis - Ores Mikres.mp3"
  );

  after(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  function copyFixture() {
    if (!fs.existsSync(fixture)) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "spoti3-latinize-tags-"));
    tmpDirs.push(dir);
    const target = path.join(dir, "sample.mp3");
    fs.copyFileSync(fixture, target);
    return target;
  }

  it("transliterates Greek string frames and leaves non-Greek frames untouched", (t) => {
    // #given — a real mp3 tagged with a mixed Greek/Latin title and Latin artist
    const file = copyFixture();
    if (!file) {
      t.skip("no fixture mp3 available under downloads/");
      return;
    }
    setTags(file, { title: "Νίκος", artist: "Café del Mar" });

    // #when
    const result = latinizeTags(file, latinize);

    // #then
    assert.strictEqual(result.changed, true);
    assert.ok(result.changedFrames.includes("TIT2"));
    assert.ok(!result.changedFrames.includes("TPE1"));

    const mp3tag = new MP3Tag(fs.readFileSync(file), true);
    mp3tag.read();
    assert.strictEqual(mp3tag.tags.v2.TIT2, "Nikos");
    assert.strictEqual(mp3tag.tags.v2.TPE1, "Café del Mar");
  });

  it("reports no change and does not write when no frame contains Greek", (t) => {
    // #given
    const file = copyFixture();
    if (!file) {
      t.skip("no fixture mp3 available under downloads/");
      return;
    }
    setTags(file, { title: "Café del Mar", artist: "Björk" });
    const before = fs.readFileSync(file);

    // #when
    const result = latinizeTags(file, latinize);

    // #then
    assert.strictEqual(result.changed, false);
    assert.deepStrictEqual(result.changedFrames, []);
    assert.ok(before.equals(fs.readFileSync(file)));
  });

  it("computes the plan without writing under dry-run", (t) => {
    // #given
    const file = copyFixture();
    if (!file) {
      t.skip("no fixture mp3 available under downloads/");
      return;
    }
    setTags(file, { title: "Νίκος" });
    const before = fs.readFileSync(file);

    // #when
    const result = latinizeTags(file, latinize, { dryRun: true });

    // #then
    assert.strictEqual(result.changed, true);
    assert.ok(result.changedFrames.includes("TIT2"));
    assert.ok(before.equals(fs.readFileSync(file)));
  });
});
