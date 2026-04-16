import test from "node:test";
import assert from "node:assert/strict";
import {
  checkRateLimit,
  resetRateLimitBucketsForTest,
} from "./rateLimit";

test("checkRateLimit blocks requests after hitting limit", () => {
  resetRateLimitBucketsForTest();

  const first = checkRateLimit({
    key: "test:block",
    windowMs: 60_000,
    limit: 2,
  });
  const second = checkRateLimit({
    key: "test:block",
    windowMs: 60_000,
    limit: 2,
  });
  const third = checkRateLimit({
    key: "test:block",
    windowMs: 60_000,
    limit: 2,
  });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(third.ok, false);
  if (!third.ok) {
    assert.ok(third.retryAfterSeconds >= 1);
  }
});

test("checkRateLimit tracks keys independently", () => {
  resetRateLimitBucketsForTest();

  const firstKey = checkRateLimit({
    key: "test:key-a",
    windowMs: 60_000,
    limit: 1,
  });
  const secondKey = checkRateLimit({
    key: "test:key-b",
    windowMs: 60_000,
    limit: 1,
  });

  assert.equal(firstKey.ok, true);
  assert.equal(secondKey.ok, true);
});
