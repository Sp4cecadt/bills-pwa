/* Bills PWA v1 — localStorage only; OAuth / Basiq / Push are stubs */
(() => {
  "use strict";

  const STORAGE_KEY = "bills-pwa-v1";
  const SETTINGS_KEY = "bills-pwa-settings-v1";

  const BRAND = {
    Netflix: { emoji: "📺", color: "#E50914" },
    Spotify: { emoji: "🎵", color: "#1DB954" },
    "Disney+": { emoji: "✨", color: "#113CCF" },
    "Origin Electricity": { emoji: "⚡", color: "#F15A22" },
    "Alinta Gas": { emoji: "🔥", color: "#E31837" },
    "Coles groceries": { emoji: "🛒", color: "#E01A22" },
    "Revo Gym": { emoji: "🏋️", color: "#111111" },
    "CGU Contents": { emoji: "🏠", color: "#003366" },
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function uid() {
    return "b_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  function daysFromNow(n) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function seedBills() {
    return [
      { id: uid(), name: "Netflix", amount: 22.99, dueDate: daysFromNow(2), source: "streaming", note: "Standard plan", likelyRecurring: false },
      { id: uid(), name: "Origin Electricity", amount: 120.00, dueDate: daysFromNow(4), source: "email", note: "Quarterly estimate", likelyRecurring: false },
      { id: uid(), name: "Coles groceries", amount: 95.00, dueDate: daysFromNow(6), source: "bank", note: "Weekly cycle · Example Bank", likelyRecurring: true },
      { id: uid(), name: "Spotify", amount: 12.99, dueDate: daysFromNow(9), source: "streaming", note: "Individual", likelyRecurring: false },
      { id: uid(), name: "Alinta Gas", amount: 75.00, dueDate: daysFromNow(12), source: "email", note: "", likelyRecurring: false },
      { id: uid(), name: "Revo Gym", amount: 50.00, dueDate: daysFromNow(15), source: "bank", note: "Monthly membership · Example Bank", likelyRecurring: true },
      { id: uid(), name: "Disney+", amount: 13.99, dueDate: daysFromNow(18), source: "streaming", note: "Monthly", likelyRecurring: false },
      { id: uid(), name: "CGU Contents", amount: 45.00, dueDate: daysFromNow(24), source: "email", note: "Monthly premium", likelyRecurring: false },
    ];
  }

  function defaultSettings() {
    return {
      emailConnected: false,
      emailAddress: "your-email@example.com",
      bankDemoLinked: false,
      bankName: "Example Bank",
      bankProvider: "Basiq",
      remindersOn: true,
      reminderDays: 3,
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const state = { bills: seedBills(), archive: [] };
        saveState(state);
        return state;
      }
      const parsed = JSON.parse(raw);
      return {
        bills: Array.isArray(parsed.bills) ? parsed.bills : seedBills(),
        archive: Array.isArray(parsed.archive) ? parsed.archive : [],
      };
    } catch {
      const state = { bills: seedBills(), archive: [] };
      saveState(state);
      return state;
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...defaultSettings(), ...JSON.parse(raw) } : defaultSettings();
    } catch {
      return defaultSettings();
    }
  }

  function saveSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }

  let state = loadState();
  let settings = loadSettings();
  let selectedId = null;
  let toastTimer = null;

  function formatAUD(n) {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(n) || 0);
  }

  function daysUntil(dueDate) {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const due = new Date(dueDate + "T12:00:00");
    return Math.round((due - today) / 86400000);
  }

  function pillClass(days) {
    if (days < 0) return "overdue";
    if (days <= 5) return "soon";
    if (days <= 14) return "mid";
    return "";
  }

  function pillLabel(days) {
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "1 day";
    return `${days} days`;
  }

  function brandFor(name) {
    if (BRAND[name]) return BRAND[name];
    for (const key of Object.keys(BRAND)) {
      if (name.toLowerCase().includes(key.toLowerCase())) return BRAND[key];
    }
    const initials = name.split(/\s+/).slice(0, 2).map((w) => (w[0] || "").toUpperCase()).join("");
    const hues = [210, 280, 160, 20, 340, 190];
    return { emoji: null, initials, color: `hsl(${hues[name.length % hues.length]} 55% 42%)` };
  }

  function logoHtml(name, extraClass = "") {
    const b = brandFor(name);
    const cls = `logo ${extraClass} ${b.emoji ? "" : "initials"}`.trim();
    return `<div class="${cls}" style="background:${b.color}" aria-hidden="true">${b.emoji || b.initials || "?"}</div>`;
  }

  function sourceLabel(src) {
    return { email: "Email", streaming: "Streaming", bank: "Bank", manual: "Manual" }[src] || src;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add("hidden"), 2400);
  }

  function openSheet(id) { $(`#${id}`).classList.remove("hidden"); }
  function closeSheet(id) { $(`#${id}`).classList.add("hidden"); }

  function updateBankBanner() {
    const banner = $("#bank-banner");
    const title = $("#bank-banner-title");
    const sub = $("#bank-banner-sub");
    const btn = $("#btn-bank-stub");
    if (settings.bankDemoLinked) {
      banner.classList.add("linked");
      title.textContent = `${settings.bankName} linked · ${settings.bankProvider} CDR`;
      sub.textContent = "Read-only · likely recurring detected";
      btn.textContent = "Manage";
    } else {
      banner.classList.remove("linked");
      title.textContent = "Connect bank via Basiq";
      sub.textContent = "AU CDR read-only · e.g. Example Bank";
      btn.textContent = "Link";
    }
  }

  function sortedActive() {
    return [...state.bills].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  function findBill(id) {
    return state.bills.find((b) => b.id === id);
  }

  function openDetail(id) {
    const b = findBill(id);
    if (!b) return;
    selectedId = id;
    const logoWrap = $("#detail-logo");
    const brand = brandFor(b.name);
    logoWrap.className = `logo lg${brand.emoji ? "" : " initials"}`;
    logoWrap.style.background = brand.color;
    logoWrap.textContent = brand.emoji || brand.initials || "?";
    $("#detail-title").textContent = b.name;
    const days = daysUntil(b.dueDate);
    $("#detail-meta").textContent = `${sourceLabel(b.source)}${b.likelyRecurring ? " · likely recurring" : ""} · due ${b.dueDate} · ${pillLabel(days)}`;
    $("#detail-amount").textContent = formatAUD(b.amount);
    const note = $("#detail-note");
    if (b.note) {
      note.textContent = b.note;
      note.classList.remove("hidden");
    } else {
      note.classList.add("hidden");
    }
    openSheet("sheet-detail");
  }

  function archiveBill(id, reason) {
    const idx = state.bills.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const [bill] = state.bills.splice(idx, 1);
    state.archive.unshift({
      ...bill,
      archiveReason: reason,
      archivedAt: new Date().toISOString(),
    });
    saveState(state);
    renderActive();
    closeSheet("sheet-detail");
    toast(reason === "paid" ? `Marked ${bill.name} as paid` : `Deleted ${bill.name}`);
  }

  function restoreBill(id) {
    const idx = state.archive.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const [bill] = state.archive.splice(idx, 1);
    delete bill.archiveReason;
    delete bill.archivedAt;
    state.bills.push(bill);
    saveState(state);
    renderArchive();
    toast(`Restored ${bill.name}`);
  }

  function bindRowGestures() {
    $$(".bill-row").forEach((row) => {
      const front = row.querySelector(".row-front");
      let startX = 0, startY = 0, dx = 0, tracking = false, horizontal = null;

      row.addEventListener("click", (e) => {
        if (e.target.closest("[data-delete]")) return;
        if (Math.abs(dx) > 8) return;
        openDetail(row.dataset.id);
      });
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetail(row.dataset.id);
        }
      });

      const delBtn = row.querySelector("[data-delete]");
      if (delBtn) {
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          archiveBill(row.dataset.id, "deleted");
        });
      }

      row.addEventListener("touchstart", (e) => {
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        dx = 0;
        tracking = true;
        horizontal = null;
        row.classList.add("swiping");
      }, { passive: true });

      row.addEventListener("touchmove", (e) => {
        if (!tracking) return;
        const t = e.touches[0];
        const mx = t.clientX - startX;
        const my = t.clientY - startY;
        if (horizontal === null) {
          if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
          horizontal = Math.abs(mx) > Math.abs(my);
          if (!horizontal) {
            tracking = false;
            front.style.transform = "";
            row.classList.remove("swiping");
            return;
          }
        }
        if (!horizontal) return;
        dx = Math.min(0, mx);
        front.style.transform = `translateX(${dx}px)`;
      }, { passive: true });

      const end = () => {
        if (!tracking) return;
        tracking = false;
        row.classList.remove("swiping");
        if (dx < -80) {
          front.style.transform = "translateX(-120%)";
          setTimeout(() => archiveBill(row.dataset.id, "deleted"), 120);
        } else {
          front.style.transform = "";
          dx = 0;
        }
      };
      row.addEventListener("touchend", end);
      row.addEventListener("touchcancel", end);
    });
  }

  function renderActive() {
    const list = $("#bill-list");
    const empty = $("#empty-active");
    const bills = sortedActive();
    if (!bills.length) {
      list.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    list.innerHTML = bills.map((b) => {
      const days = daysUntil(b.dueDate);
      const tags = [
        `<span class="tag ${b.source}">${sourceLabel(b.source)}</span>`,
        b.likelyRecurring ? `<span class="tag likely">Likely recurring</span>` : "",
      ].join("");
      return `
        <article class="bill-row" data-id="${b.id}" tabindex="0" role="button"
          aria-label="${escapeAttr(b.name)}, ${formatAUD(b.amount)}, ${pillLabel(days)}">
          <div class="swipe-bg" aria-hidden="true">Delete</div>
          <div class="row-front">
            ${logoHtml(b.name)}
            <div class="row-main">
              <div class="row-name">${escapeHtml(b.name)}</div>
              <div class="row-tags">${tags}</div>
            </div>
            <div class="row-right">
              <div class="amount">${formatAUD(b.amount)}</div>
              <span class="pill ${pillClass(days)}">${pillLabel(days)}</span>
              <button type="button" class="row-delete-desk" data-delete="${b.id}"
                aria-label="Delete ${escapeAttr(b.name)}">Delete</button>
            </div>
          </div>
        </article>`;
    }).join("");
    bindRowGestures();
  }

  function renderArchive() {
    const list = $("#archive-list");
    const empty = $("#empty-archive");
    const items = [...state.archive].sort((a, b) => (b.archivedAt || "").localeCompare(a.archivedAt || ""));
    if (!items.length) {
      list.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    list.innerHTML = items.map((b) => {
      const when = b.archivedAt
        ? new Date(b.archivedAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })
        : "";
      const reason = b.archiveReason === "paid" ? "Paid" : "Deleted";
      return `
        <article class="archive-row" data-id="${b.id}">
          ${logoHtml(b.name)}
          <div class="archive-meta">
            <div class="row-name">${escapeHtml(b.name)}</div>
            <div class="reason">${reason} · ${formatAUD(b.amount)} · ${escapeHtml(when)}</div>
          </div>
          <button type="button" class="btn-restore" data-restore="${b.id}">Restore</button>
        </article>`;
    }).join("");
  }

  function showActive() {
    $("#view-active").classList.remove("hidden");
    $("#view-archive").classList.add("hidden");
    $("#btn-add").classList.remove("hidden");
    renderActive();
  }

  function showArchive() {
    $("#view-active").classList.add("hidden");
    $("#view-archive").classList.remove("hidden");
    $("#btn-add").classList.add("hidden");
    renderArchive();
  }

  function syncSettingsUI() {
    $("#toggle-bank-demo").checked = !!settings.bankDemoLinked;
    $("#toggle-reminders").checked = !!settings.remindersOn;
    $("#reminder-days").value = settings.reminderDays || 3;
    updateBankBanner();
  }

  function wire() {
    const fab = $("#btn-add");
    if (fab) fab.textContent = "+ ADD BILL OR SUBSCRIPTION"; // Force FAB label
    document.body.addEventListener("click", (e) => {
      const close = e.target.closest("[data-close]");
      if (close) closeSheet(close.getAttribute("data-close"));
      const restore = e.target.closest("[data-restore]");
      if (restore) restoreBill(restore.getAttribute("data-restore"));
    });

    $("#btn-add").addEventListener("click", () => {
      const form = $("#form-add");
      form.reset();
      form.dueDate.value = daysFromNow(7);
      form.source.value = "manual";
      openSheet("sheet-add");
      setTimeout(() => form.name.focus(), 50);
    });

    $("#form-add").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const bill = {
        id: uid(),
        name: String(fd.get("name") || "").trim(),
        amount: Number(fd.get("amount")),
        dueDate: String(fd.get("dueDate")),
        source: String(fd.get("source") || "manual"),
        note: String(fd.get("note") || "").trim(),
        likelyRecurring: String(fd.get("source")) === "bank",
      };
      if (!bill.name || !(bill.amount > 0) || !bill.dueDate) {
        toast("Please fill name, amount, and due date");
        return;
      }
      state.bills.push(bill);
      saveState(state);
      closeSheet("sheet-add");
      renderActive();
      toast(`Added ${bill.name}`);
    });

    $("#btn-mark-paid").addEventListener("click", () => {
      if (selectedId) archiveBill(selectedId, "paid");
    });
    $("#btn-delete").addEventListener("click", () => {
      if (selectedId) archiveBill(selectedId, "deleted");
    });

    $("#btn-archive").addEventListener("click", showArchive);
    $("#btn-back-active").addEventListener("click", showActive);

    $("#btn-settings").addEventListener("click", () => {
      syncSettingsUI();
      openSheet("sheet-settings");
    });

    $("#btn-bank-stub").addEventListener("click", () => {
      syncSettingsUI();
      openSheet("sheet-settings");
      toast("Bank link is a stub until Basiq credentials (v3)");
    });

    $("#btn-email-stub").addEventListener("click", () => {
      toast("Email OAuth stub — needs Yahoo/Gmail client for your-email@example.com (v2)");
    });
    $("#btn-basiq-stub").addEventListener("click", () => {
      toast("Basiq CDR stub — needs API keys + consent (v3)");
    });
    $("#btn-push-stub").addEventListener("click", () => {
      toast("Push + email reminders stub — needs VAPID + mail sender (v4)");
    });

    $("#toggle-bank-demo").addEventListener("change", (e) => {
      settings.bankDemoLinked = e.target.checked;
      saveSettings(settings);
      updateBankBanner();
      toast(settings.bankDemoLinked ? "Demo: Example Bank shown as linked" : "Demo bank link cleared");
    });

    $("#toggle-reminders").addEventListener("change", (e) => {
      settings.remindersOn = e.target.checked;
      saveSettings(settings);
    });
    $("#reminder-days").addEventListener("change", (e) => {
      const n = Math.min(14, Math.max(1, Number(e.target.value) || 3));
      e.target.value = n;
      settings.reminderDays = n;
      saveSettings(settings);
    });

    $("#btn-reset-seed").addEventListener("click", () => {
      if (!confirm("Replace all local bills with demo seed data?")) return;
      state = { bills: seedBills(), archive: [] };
      saveState(state);
      closeSheet("sheet-settings");
      showActive();
      toast("Demo seed restored");
    });

    $("#btn-clear-all").addEventListener("click", () => {
      if (!confirm("Clear all bills and archive from this device?")) return;
      state = { bills: [], archive: [] };
      saveState(state);
      closeSheet("sheet-settings");
      showActive();
      toast("Local data cleared");
    });
  }

  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) =>
          Promise.all(
            regs.map((r) => {
              const script = r.active && r.active.scriptURL;
              // Drop any worker that is not our v4 URL so iOS cannot keep an old shell
              if (script && !script.includes("sw.js?v=5")) return r.unregister();
              return Promise.resolve();
            })
          )
        )
        .then(() => navigator.serviceWorker.register("./sw.js?v=5"))
        .then((reg) => reg.update())
        .catch(() => {});
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    wire();
    updateBankBanner();
    renderActive();
    registerSW();
  });
})();
