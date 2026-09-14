import { registry, getRecord, countByStatus, totalCount } from "./registry.js";
import { contractGate, socialGate } from "./gates.js";

const $ = (id) => document.getElementById(id);

function fmtDate(iso) {
  if (!iso) return null;
  return iso;
}

function renderBar() {
  const chain = getRecord("chain.name");
  const chainId = getRecord("chain.id");
  $("bar-chain").textContent = chain.status === "stated" ? chain.value : "chain unconfirmed";
  $("bar-chainid").textContent = chainId.status === "stated" ? chainId.value : "";

  const clockEl = $("bar-clock");
  function tick() {
    const now = new Date();
    clockEl.textContent = now.toUTCString().slice(17, 25) + " UTC";
  }
  tick();
  setInterval(tick, 1000);
}

const ICONS = {
  x: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  github: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
};

function renderSocials() {
  ["x", "github"].forEach((platform) => {
    const record = getRecord(`social.${platform}`);
    const gate = socialGate(record);
    const el = $(`social-${platform}`);
    el.innerHTML = ICONS[platform];
    el.dataset.status = record.status;
    el.dataset.gate = gate.reason;

    if (gate.ok) {
      el.setAttribute("href", record.url);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
      el.setAttribute("aria-label", `${record.label} — ${gate.handle}`);
      el.classList.remove("inert");
    } else {
      el.removeAttribute("href");
      el.setAttribute("aria-disabled", "true");
      el.setAttribute(
        "aria-label",
        `${record.label} — ${record.status === "unconfirmed" ? "unconfirmed" : "not verified"}`
      );
      el.classList.add("inert");
    }
  });
}

function renderCA() {
  const record = getRecord("contract.address");
  const valueEl = $("ca-value");
  const statusEl = $("ca-status");
  const copyBtn = $("ca-copy");

  if (record.status === "stated" && record.value) {
    valueEl.textContent = record.value;
    statusEl.textContent = `stated · ${fmtDate(record.asOf)}`;
    copyBtn.disabled = false;
  } else {
    valueEl.textContent = "—";
    statusEl.textContent = `${record.status} · no contract on record yet`;
    copyBtn.disabled = true;
  }

  copyBtn.addEventListener("click", async () => {
    const gate = contractGate(record.value || "", record);
    if (!gate.ok) return;
    try {
      await navigator.clipboard.writeText(record.value);
      const original = copyBtn.textContent;
      copyBtn.textContent = "copied";
      setTimeout(() => (copyBtn.textContent = original), 1500);
    } catch {
      /* clipboard unavailable — silently no-op, button stays as-is */
    }
  });
}

function renderRegister() {
  const grid = $("register-grid");
  grid.innerHTML = "";
  registry.forEach((r) => {
    const card = document.createElement("div");
    card.className = `register-card status-${r.status}`;
    const value =
      r.status === "stated" ? r.value : r.status === "unconfirmed" ? "unconfirmed" : "absent";
    card.innerHTML = `
      <div class="register-k">${r.label}</div>
      <div class="register-v">${value}</div>
      <div class="register-meta">${r.status}${r.asOf ? " · " + r.asOf : ""}</div>
    `;
    grid.appendChild(card);
  });

  const stated = countByStatus("stated");
  const total = totalCount();
  $("register-count").textContent = `(${stated}/${total} stated)`;
}

function renderLinks() {
  const list = $("links-list");
  list.innerHTML = "";
  registry
    .filter((r) => r.group === "social" || r.id === "chain.rpc")
    .forEach((r) => {
      const li = document.createElement("li");
      if (r.group === "social") {
        const gate = socialGate(r);
        li.textContent = `${r.label}: `;
        const span = document.createElement("span");
        if (gate.ok) {
          const a = document.createElement("a");
          a.href = r.url;
          a.textContent = gate.handle;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          span.appendChild(a);
        } else {
          span.textContent = record_status_text(r);
          span.className = "muted";
        }
        li.appendChild(span);
      } else {
        li.textContent = `${r.label}: `;
        const code = document.createElement("code");
        code.textContent = r.status === "stated" ? r.value : "unconfirmed";
        li.appendChild(code);
      }
      list.appendChild(li);
    });
}

function record_status_text(r) {
  return r.status === "unconfirmed" ? "unconfirmed" : "absent";
}

renderBar();
renderSocials();
renderCA();
renderRegister();
renderLinks();
