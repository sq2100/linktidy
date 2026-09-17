import test from "node:test";
import assert from "node:assert/strict";
import { cleanURL, cleanBatch } from "../src/core.js";
test("removes tracking without rewriting useful raw encoding or fragments", () => {
  assert.equal(
    cleanURL("https://x.test/p?q=a%20b&UTM_source=x&q=two#utm_source=keep")
      .cleaned,
    "https://x.test/p?q=a%20b&q=two#utm_source=keep",
  );
  assert.equal(cleanURL("https://x.test/?utm_a=1").cleaned, "https://x.test/");
});
test("signed and authenticated URLs are preserved", () => {
  for (const x of [
    "https://x.test/?X-Amz-Signature=abc&utm_source=x",
    "https://x.test/?token=x&fbclid=y",
    "https://user:pass@x.test/?utm_x=x",
  ])
    assert.equal(cleanURL(x).cleaned, x);
});
test("encoded tracking keys, repeated keys and malformed input", () => {
  assert.equal(
    cleanURL("https://x.test/?%75tm_source=x&fbclid=1&fbclid=2&x=3").cleaned,
    "https://x.test/?x=3",
  );
  assert.equal(cleanURL("javascript:alert(1)").status, "Unsupported scheme");
  assert.equal(cleanURL("not a url").status, "Invalid");
  assert.match(cleanURL("https://x.test/?%ZZ=1&utm_x=y").status, /skipped/);
  assert.throws(() => cleanBatch(""));
});
