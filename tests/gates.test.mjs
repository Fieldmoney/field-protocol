import { test } from "node:test";
import assert from "node:assert/strict";
import { isAddressShaped, contractGate, socialGate, deriveHandle } from "../js/gates.js";
import { registry, countByStatus, totalCount } from "../js/registry.js";

// ---- registry sanity ----

test("registry: CA is either absent or stated-with-a-valid-value; socials start unconfirmed", () => {
  const ca = registry.find((r) => r.id === "contract.address");
  const x = registry.find((r) => r.id === "social.x");
  const gh = registry.find((r) => r.id === "social.github");

  assert.ok(["absent", "stated"].includes(ca.status));
  if (ca.status === "absent") {
    assert.equal(ca.value, null);
  } else {
    assert.equal(isAddressShaped(ca.value), true);
  }

  assert.equal(x.status, "unconfirmed");
  assert.equal(gh.status, "unconfirmed");
  assert.ok(totalCount() >= 3);
  assert.equal(countByStatus("stated"), registry.filter((r) => r.status === "stated").length);
});

// ---- contract gate: prove it can FAIL on throwaway copy ----

test("contractGate: rejects a non-address string outright", () => {
  const result = contractGate("not an address", { status: "absent" });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "not-address-shaped");
});

test("contractGate: rejects an address-shaped throwaway that isn't the registered address", () => {
  // GATE WARNING: this is address-shaped 0x hex, but must still fail — no blanket accept.
  const throwaway = "0x" + "0".repeat(32) + "deadbeef";
  const record = registry.find((r) => r.id === "contract.address");
  const expectedReason =
    record.status === "stated" ? "does-not-match-registry" : "no-verified-contract-on-record";
  assert.equal(isAddressShaped(throwaway), true);
  const result = contractGate(throwaway, record);
  assert.equal(result.ok, false);
  assert.equal(result.reason, expectedReason);
});

test("contractGate: rejects an address-shaped throwaway that mismatches a stated record", () => {
  const stated = { status: "stated", value: "0x" + "1".repeat(36) + "aaaa" };
  const throwaway = "0x" + "2".repeat(36) + "bbbb";
  const result = contractGate(throwaway, stated);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "does-not-match-registry");
});

test("contractGate: passes only when address-shaped input matches a stated registry value", () => {
  const stated = { status: "stated", value: "0x" + "1".repeat(36) + "aaaa" };
  const result = contractGate("0x" + "1".repeat(36) + "AAAA", stated);
  assert.equal(result.ok, true);
});

// ---- social gate: prove it can FAIL on throwaway copy ----

test("socialGate: rejects when record is unconfirmed, even with a plausible-looking URL", () => {
  const throwaway = { status: "unconfirmed", platform: "x", url: "https://x.com/fieldmoney" };
  const result = socialGate(throwaway);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "not-stated");
});

test("socialGate: rejects a stated record whose URL host doesn't match the platform", () => {
  const wrongHost = { status: "stated", platform: "x", url: "https://example.com/fieldmoney" };
  const result = socialGate(wrongHost);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "host-mismatch");
});

test("socialGate: passes and derives a handle when stated + host matches", () => {
  const good = { status: "stated", platform: "github", url: "https://github.com/fieldmoney" };
  const result = socialGate(good);
  assert.equal(result.ok, true);
  assert.equal(result.handle, "@fieldmoney");
});

test("deriveHandle: comes from the stored URL, not a separately entered string", () => {
  assert.equal(deriveHandle("https://x.com/fieldmoney"), "@fieldmoney");
  assert.equal(deriveHandle("not a url"), null);
});

// ---- current live state: both gates must be inert right now ----

test("live registry: contract and social gates are currently inert (nothing stated yet)", () => {
  const ca = registry.find((r) => r.id === "contract.address");
  const x = registry.find((r) => r.id === "social.x");
  const gh = registry.find((r) => r.id === "social.github");

  assert.equal(contractGate("0x" + "1".repeat(36) + "aaaa", ca).ok, false);
  assert.equal(socialGate(x).ok, false);
  assert.equal(socialGate(gh).ok, false);
});
