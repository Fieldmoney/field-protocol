// Pure gate logic. No DOM access here so it can be unit-tested directly
// from tests/gates.test.mjs without a browser.

const ADDRESS_SHAPE = /^0x[0-9a-fA-F]{40}$/;

const PLATFORM_HOSTS = {
  x: ["x.com", "twitter.com"],
  github: ["github.com"],
};

// GATE WARNING compliance: this checks *shape* only. Shape alone never
// authorizes a render — see contractGate() below, which is the real gate.
export function isAddressShaped(input) {
  return typeof input === "string" && ADDRESS_SHAPE.test(input.trim());
}

// The only gate allowed to make a contract address live: the input must be
// address-shaped AND match the registry's stated record for that address.
// A throwaway address that merely "looks like" 0x-hex must fail here.
export function contractGate(input, record) {
  const trimmed = typeof input === "string" ? input.trim() : "";

  if (!isAddressShaped(trimmed)) {
    return { ok: false, reason: "not-address-shaped" };
  }
  if (!record || record.status !== "stated" || !record.value) {
    return { ok: false, reason: "no-verified-contract-on-record" };
  }
  if (trimmed.toLowerCase() !== record.value.toLowerCase()) {
    return { ok: false, reason: "does-not-match-registry" };
  }
  return { ok: true, reason: "matches-registry" };
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

// LINK RULE: the handle is derived from the stored URL, never entered separately.
export function deriveHandle(url) {
  try {
    const u = new URL(url);
    const segment = u.pathname.split("/").filter(Boolean)[0] || "";
    return segment ? `@${segment}` : null;
  } catch {
    return null;
  }
}

// A social icon goes live only if the record is stated AND its URL host
// actually belongs to that platform. An unconfirmed record, a missing URL,
// or a URL on the wrong host must all render inert.
export function socialGate(record) {
  if (!record || record.status !== "stated" || !record.url) {
    return { ok: false, reason: "not-stated" };
  }
  const host = hostOf(record.url);
  const allowed = PLATFORM_HOSTS[record.platform] || [];
  if (!host || !allowed.includes(host)) {
    return { ok: false, reason: "host-mismatch" };
  }
  const handle = deriveHandle(record.url);
  if (!handle) {
    return { ok: false, reason: "unparseable-url" };
  }
  return { ok: true, reason: "verified", handle };
}
