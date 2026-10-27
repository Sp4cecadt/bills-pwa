# Bills — iPhone PWA (v1)

Bill & subscription tracker for the owner. Installable on iPhone Home Screen via Safari. Private local project — do not publish unless asked.

See [SPEC.md](./SPEC.md) for the full product spec.

## Quick start (local)

```bash
cd /workspace/bills-pwa
python3 -m http.server 8765
```

Open **http://localhost:8765** (or the machine’s LAN IP on your phone on the same Wi‑Fi).

> Service worker and Add to Home Screen need HTTPS or `localhost`. Plain `file://` will load the UI but SW / install may not work.

## Add to iPhone Home Screen

1. Open the URL in **Safari** (not Chrome).
2. Tap **Share** → **Add to Home Screen**.
3. Confirm name **Bills** → Add.
4. Launch from the Home Screen icon (standalone, status-bar themed).

## What works in v1

- Soonest-due list (seed demo data + your adds)
- Logos / coloured initials, source tags, amounts, day-countdown pills
- **+ Add bill or sub** form → saves to `localStorage`
- Tap a bill → **Mark paid** or **Delete** (both go to Archive)
- Swipe left (touch) or Delete button (desktop) → archive
- Archive view + **Restore** to active list
- Settings sheet (stubs + reminder prefs stored locally)
- Offline shell via service worker
- PWA manifest + Apple meta tags

## Stubbed (needs credentials later)

| Feature | Status | Needs from Shannon |
|---------|--------|--------------------|
| Yahoo/Gmail OAuth (`your-email@example.com`) | UI stub only | OAuth client + consent for billing/subscription senders |
| Basiq CDR bank link (Example Bank) | UI stub only | Basiq API keys + consent |
| Web Push + email reminders (3 days before) | Prefs saved; delivery stub | Push VAPID keys + mail sender |

**Do not invent API keys.** Wire these in v2–v4 per SPEC.

## Key files

| Path | Role |
|------|------|
| `index.html` | App shell |
| `styles.css` | iOS-style mobile UI |
| `app.js` | Data, list, archive, forms, stubs |
| `manifest.webmanifest` | PWA manifest |
| `sw.js` | Offline shell |
| `icons/` | App icons (SVG) |
| `SPEC.md` | Full product spec |
| `README.md` | This file |

## Privacy

v1 keeps everything in the browser’s `localStorage` on device. No backend. No public deploy.
