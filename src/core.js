const TRACKING = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "_ga",
  "_gl",
  "igshid",
  "igsh",
  "vero_id",
  "oly_anon_id",
  "oly_enc_id",
  "rb_clickid",
  "s_cid",
]);
const SIGNED = new Set([
  "signature",
  "sig",
  "token",
  "access_token",
  "x-amz-signature",
  "x-goog-signature",
  "x-amz-credential",
  "x-goog-credential",
  "policy",
  "key-pair-id",
]);
function decodedKey(pair) {
  try {
    return decodeURIComponent(
      pair.split("=")[0].replaceAll("+", " "),
    ).toLowerCase();
  } catch {
    return null;
  }
}
export function cleanURL(input) {
  const original = input.trim();
  let url;
  try {
    url = new URL(original);
  } catch {
    return { original, cleaned: original, status: "Invalid", removed: [] };
  }
  if (!["http:", "https:"].includes(url.protocol))
    return {
      original,
      cleaned: original,
      status: "Unsupported scheme",
      removed: [],
    };
  if (url.username || url.password)
    return {
      original,
      cleaned: original,
      status: "Credentials present — skipped",
      removed: [],
    };
  const hashAt = original.indexOf("#"),
    base = hashAt < 0 ? original : original.slice(0, hashAt),
    fragment = hashAt < 0 ? "" : original.slice(hashAt),
    q = base.indexOf("?");
  if (q < 0)
    return { original, cleaned: original, status: "Unchanged", removed: [] };
  const pairs = base.slice(q + 1).split("&"),
    keys = pairs.map(decodedKey);
  if (keys.some((k) => k === null))
    return {
      original,
      cleaned: original,
      status: "Malformed encoding — skipped",
      removed: [],
    };
  if (keys.some((k) => SIGNED.has(k)))
    return {
      original,
      cleaned: original,
      status: "Signed / token URL — skipped",
      removed: [],
    };
  const removed = [],
    kept = [];
  pairs.forEach((pair, i) => {
    const key = keys[i];
    if (key.startsWith("utm_") || TRACKING.has(key))
      removed.push(pair.split("=")[0]);
    else kept.push(pair);
  });
  if (!removed.length)
    return { original, cleaned: original, status: "Unchanged", removed };
  return {
    original,
    cleaned:
      base.slice(0, q) + (kept.length ? "?" + kept.join("&") : "") + fragment,
    status: "Cleaned",
    removed,
  };
}
export function cleanBatch(text) {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length > 10000)
    throw new Error("Use at most 10,000 links per batch.");
  if (!lines.length) throw new Error("Add at least one HTTP or HTTPS link.");
  return lines.map(cleanURL);
}
