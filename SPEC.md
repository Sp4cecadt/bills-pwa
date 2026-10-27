# Bills Tracking PWA — Product Spec

**Owner:** the owner (Adelaide, AU)  
**Platform:** Progressive Web App (PWA) for iPhone Home Screen (no Apple Developer account required)  
**Email for product OAuth sync:** your-email@example.com  
**Status:** Spec for v1–v4 phased delivery. Private / not published.

---

## 1. Vision

A clean, iOS-style bill-and-subscription tracker that lives on the iPhone Home Screen. It pulls upcoming amounts from email and (later) a read-only bank feed, mixes in streaming subscriptions, and surfaces everything in one soonest-due list with logos, amounts, and day countdowns. Manual entry covers anything the integrations miss. Paid and deleted items leave the active list but stay in an archive.

---

## 2. Core requirements (from call)

### 2.1 Email-synced bills
- Source mailbox: **your-email@example.com**
- Auth: OAuth scoped to **billing senders** (and subscription senders — see 2.2)
- Parse bill/invoice emails for merchant name, amount, and due date
- Insert / update entries in the active soonest-due list with source tag `email`

### 2.2 Streaming subscriptions
- Same flow as bills; treated as recurring obligations
- Seed examples: **Netflix**, **Spotify**, **Disney+**
- Source tag `streaming` (may originate from email or manual)
- Appear in the same soonest-due list with logos, amounts, day countdowns

### 2.3 Bank feed (Australian CDR)
- Link a bank account **read-only** through an Australian CDR provider (e.g. **Basiq**)
- Example bank: **Example Bank**
- Pull transaction history
- Detect expenses that repeat on a regular cycle and mark them as **likely recurring**
- Examples: **Coles** groceries, **Revo** gym
- Source tag `bank` (or `bank-recurring`)
- Listed alongside email bills and streaming in the same soonest-due list

### 2.4 Soonest-due list (primary UI)
- Sorted by due date ascending (soonest at top)
- Each row shows:
  - Company / service logo (or coloured initials / emoji fallback)
  - Bill / service name
  - Source tag (email / streaming / bank / manual)
  - Amount (AUD)
  - Days-remaining countdown pill
- Header: **Bills**
- Subtitle: Email · Bank feed · Manual
- Optional banner for bank-link status (e.g. “Connect bank via Basiq” / “Example Bank linked · Basiq CDR”)

### 2.5 Manual entry
- For bills / subs with no email (or not yet detected by bank)
- Big primary button: **+ Add bill or sub**
- Form fields: name, amount, due date, source (manual / email / streaming / bank), optional note
- Saves into the same active list

### 2.6 Paid → archive
- When a bill is marked **paid**, remove it from the active list
- Keep an **archive** of paid entries (reason: `paid`, with archived timestamp)

### 2.7 Swipe left to delete → archive
- Swipe left (mobile) deletes an entry
- Desktop: visible Delete affordance
- Deleted items go to the same archive (reason: `deleted`)
- Archive supports **restore** back to the active list

### 2.8 Reminders (3 days before due)
- Push notification **and** email
- Default: enabled, 3 days before due date
- Configurable in Settings

---

## 3. Data sources

| Source            | Tag         | How it enters the list                                      |
|-------------------|-------------|-------------------------------------------------------------|
| Email OAuth       | `email`     | Parsed from your-email@example.com billing/subscription mail |
| Streaming         | `streaming` | Email parse and/or manual; Netflix, Spotify, Disney+, etc. |
| Bank recurring    | `bank`      | CDR/Basiq transaction history → cycle detection            |
| Manual            | `manual`    | User form via “+ Add bill or sub”                          |

---

## 4. Privacy & security

- **On-device first** for v1: all active + archive data in `localStorage` (no backend)
- Email OAuth: minimal scopes — billing / subscription senders only (v2)
- Bank: **CDR read-only** via Basiq (or equivalent); never write payments or transfers
- No real API keys or secrets in the repo
- Do not publish the project publicly unless Shannon asks
- Out of scope for payment: the app never stores card numbers or initiates pay

---

## 5. PWA install (iPhone)

- `manifest.webmanifest` + service worker (offline shell)
- Meta: `apple-mobile-web-app-capable`, theme-color, apple-touch-icon
- User flow: open in Safari → Share → **Add to Home Screen**
- No Apple Developer account required for Home Screen PWA

---

## 6. Out of scope for v1

- Actual payment / autopay / BPAY / PayTo
- Real Gmail/Yahoo OAuth token exchange
- Real Basiq / CDR credentials and live bank sync
- Real Web Push subscription + email reminder delivery
- Multi-user / cloud sync / accounts
- Public deployment / GitHub Pages

---

## 7. Phased delivery

| Phase | Scope |
|-------|--------|
| **v1** (this build) | UI matching mockups, localStorage, seed demo data, manual add, mark paid, swipe/delete → archive, restore, Settings stubs, installable PWA shell |
| **v2** | Email OAuth for your-email@example.com scoped to billing + subscription senders; parse and upsert bills/subs |
| **v3** | Basiq (or other AU CDR) read-only bank link (e.g. Example Bank); transaction history; recurring detection; “likely recurring” items in list |
| **v4** | Web Push + email reminders 3 days before due; reminder prefs in Settings |

---

## 8. UI details (from mockups)

- Clean light iOS-style list
- Day-countdown pills: green ≤5 days, amber ≤14, gray otherwise; **red if overdue**
- Big blue **+ Add bill or sub** button (bottom / sticky)
- Bank banner stub when not linked
- Settings sheet: connected email (stub), bank link stub, reminder prefs (default on, 3 days)

---

## 9. Demo seed data (v1 — not real accounts)

Plausible AU amounts and staggered due dates, e.g.:

- Netflix (streaming)
- Origin Electricity (email)
- Coles groceries (bank recurring)
- Spotify (streaming)
- Alinta Gas (email)
- Revo Gym (bank recurring)
- Disney+ (streaming)
- CGU Contents (email)

---

## 10. Success criteria (v1)

- `SPEC.md` matches this document
- Local server → list shows, add / mark paid / delete / archive / restore work
- Data survives refresh (`localStorage`)
- Clear stubs for OAuth, Basiq, and reminders
- No real API keys; not emailed; not deployed publicly
