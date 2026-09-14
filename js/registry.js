// Single source of truth. Every external fact lives here as one record.
// status: 'stated' | 'absent' | 'unconfirmed'
// Nothing outside this file may hardcode a fact value or a count derived from it.

export const registry = [
  {
    id: "project.name",
    group: "project",
    label: "Name",
    status: "stated",
    value: "Field",
    source: "client statement",
    asOf: "2026-09-13",
  },
  {
    id: "project.domain",
    group: "project",
    label: "Domain",
    status: "stated",
    value: "field.money",
    source: "client statement",
    asOf: "2026-09-13",
  },
  {
    id: "chain.name",
    group: "chain",
    label: "Chain",
    status: "stated",
    value: "Robinhood Chain",
    source: "client statement",
    asOf: "2026-09-14",
  },
  {
    id: "chain.id",
    group: "chain",
    label: "Chain ID",
    status: "stated",
    value: "0x1237",
    source: "client statement",
    asOf: "2026-09-14",
  },
  {
    id: "chain.rpc",
    group: "chain",
    label: "RPC endpoint",
    status: "stated",
    value: "https://rpc.mainnet.chain.robinhood.com",
    source: "client statement",
    asOf: "2026-09-14",
  },
  {
    id: "contract.address",
    group: "contract",
    label: "Contract address",
    status: "absent",
    value: null,
    source: null,
    asOf: null,
  },
  {
    id: "social.x",
    group: "social",
    label: "X",
    status: "unconfirmed",
    platform: "x",
    url: null,
    asOf: null,
  },
  {
    id: "social.github",
    group: "social",
    label: "GitHub",
    status: "unconfirmed",
    platform: "github",
    url: null,
    asOf: null,
  },
];

export function getRecord(id) {
  return registry.find((r) => r.id === id) || null;
}

export function countByStatus(status, group) {
  return registry.filter(
    (r) => r.status === status && (!group || r.group === group)
  ).length;
}

export function totalCount(group) {
  return registry.filter((r) => !group || r.group === group).length;
}
