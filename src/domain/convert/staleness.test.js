import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  STALE_AFTER_DAYS,
  parseYtDlpVersionDate,
  ytDlpAgeDays,
  hintIfStale,
  resetStalenessState,
} from "./staleness.js";

const makeLog = () => {
  const lines = [];
  return { lines, warn: (m) => lines.push(m) };
};

describe("parseYtDlpVersionDate", () => {
  it("parses a plain version", () => {
    assert.equal(parseYtDlpVersionDate("2026.08.19").toISOString(), "2026-08-19T00:00:00.000Z");
  });

  it("parses a suffixed version with trailing newline", () => {
    assert.equal(parseYtDlpVersionDate("2026.08.19.1\n").toISOString(), "2026-08-19T00:00:00.000Z");
  });

  it("returns null for garbage", () => {
    for (const bad of ["", "abc", "2026.13.40", "2026.08", null, undefined]) {
      assert.equal(parseYtDlpVersionDate(bad), null);
    }
  });
});

describe("ytDlpAgeDays", () => {
  const now = new Date(Date.UTC(2026, 9, 3));

  it("returns whole days", () => {
    assert.equal(ytDlpAgeDays("2026.08.19", now), 45);
    assert.equal(ytDlpAgeDays("2026.10.03", now), 0);
  });

  it("returns null for unparseable versions", () => {
    assert.equal(ytDlpAgeDays("nope", now), null);
  });
});

describe("hintIfStale", () => {
  beforeEach(() => resetStalenessState());

  it("stays silent at or below the threshold and for unknown age", () => {
    const log = makeLog();
    assert.equal(hintIfStale("failure", { ageDays: STALE_AFTER_DAYS, log }), false);
    assert.equal(hintIfStale("failure", { ageDays: null, log }), false);
    assert.equal(log.lines.length, 0);
  });

  it("warns above the threshold with hedged wording", () => {
    const log = makeLog();
    assert.equal(hintIfStale("failure", { ageDays: STALE_AFTER_DAYS + 1, log }), true);
    assert.match(log.lines[0], /46 days old and may be failing because of it\. Try: brew upgrade yt-dlp/);
  });

  it("prints each kind at most once", () => {
    const log = makeLog();
    hintIfStale("failure", { ageDays: 100, log });
    hintIfStale("failure", { ageDays: 100, log });
    hintIfStale("startup", { ageDays: 100, log });
    hintIfStale("startup", { ageDays: 100, log });
    assert.equal(log.lines.length, 2);
  });

  it("never throws", () => {
    const log = { warn: () => { throw new Error("boom"); } };
    assert.equal(hintIfStale("failure", { ageDays: 100, log }), false);
  });
});
