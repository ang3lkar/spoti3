import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { logger } from "../../utils/logger.js";
import {
  STALE_AFTER_DAYS,
  ytDlpAgeDays,
  hintIfStale,
  resetStalenessState,
} from "./staleness.js";

describe("ytDlpAgeDays", () => {
  const now = new Date(Date.UTC(2026, 9, 3));

  it("parses a plain version", () => {
    assert.equal(ytDlpAgeDays("2026.08.19", now), 45);
  });

  it("parses a suffixed version with trailing newline", () => {
    assert.equal(ytDlpAgeDays("2026.08.19.1\n", now), 45);
  });

  it("returns 0 on the release day", () => {
    assert.equal(ytDlpAgeDays("2026.10.03", now), 0);
  });

  it("returns null for garbage", () => {
    for (const bad of ["", "abc", "2026.08", "v2026.08.19"]) {
      assert.equal(ytDlpAgeDays(bad, now), null);
    }
  });
});

describe("hintIfStale", () => {
  beforeEach(() => {
    resetStalenessState();
    mock.method(logger, "warn", () => {});
  });

  afterEach(() => mock.restoreAll());

  it("stays silent at the threshold", () => {
    hintIfStale({ ageDays: STALE_AFTER_DAYS });
    assert.equal(logger.warn.mock.callCount(), 0);
  });

  it("stays silent for unknown age", () => {
    hintIfStale({ ageDays: null });
    assert.equal(logger.warn.mock.callCount(), 0);
  });

  it("warns above the threshold with hedged wording", () => {
    hintIfStale({ ageDays: STALE_AFTER_DAYS + 1 });
    assert.match(
      logger.warn.mock.calls[0].arguments[0],
      /46 days old and may be failing because of it\. Try: brew upgrade yt-dlp/,
    );
  });

  it("prints at most once per process", () => {
    hintIfStale({ ageDays: 100 });
    hintIfStale({ ageDays: 100 });
    assert.equal(logger.warn.mock.callCount(), 1);
  });
});
