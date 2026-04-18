# CARTHEON — Developer Setup

How to run, develop, and deploy the CARTHEON storefront locally.

---

## Project layout

```
lume-store/
├── index.html          # Storefront (landing + product catalog)
├── styles.css
├── script.js           # Scroll animations, cart logic
├── admin.html          # Admin panel (password-protected)
├── admin.css
├── admin.js            # Admin logic, product CRUD, recovery flow
├── track.html          # Order tracking page
├── chatbot.js          # Customer chatbot
├── chatbot.css
├── emailjs-config.js   # Paste your EmailJS keys here
├── logo.svg            # Brand mark (horizontal)
├── logo-white.svg
├── logo-icon.svg
├── package.json
└── docs/               # All documentation (this folder)
```

This is a **vanilla static site** — HTML + CSS + JS, no framework, no build step. Everything runs client-side; data lives in `localStorage`.

---

## Prerequisites

One of:

- **Node.js 18+** (check: `node --version`) — uses `npx serve` from `package.json`.
- **Python 3** — alternative static server (`python -m http.server`).
- Any static server will do (VS Code Live Server extension, Caddy, nginx, …).

A modern browser (Chrome / Edge / Firefox) with dev tools.

---

## Run locally

### Option A — npm (preferred)

From the project root:

```bash
npm start
```

Serves on http://localhost:8080.

Or for dev mode with CORS enabled:

```bash
npm run dev
```

Serves on http://localhost:3000.

### Option B — Python

```bash
python -m http.server 8080
```

### Option C — VS Code Live Server

Right-click `index.html` → "Open with Live Server". Hot-reload on save.

---

## Pages

| URL | Page | Auth |
|---|---|---|
| `http://localhost:8080/` | Storefront | Public |
| `http://localhost:8080/admin.html` | Admin dashboard | Password |
| `http://localhost:8080/track.html?order=XXX` | Order tracking | Public |

### Admin access

- First-time bootstrap: open `admin.html`, set master password and recovery email.
- Both are stored hashed (PBKDF2 + salt) in `localStorage` under the current browser profile.
- Recovery flow uses EmailJS — see `docs/setup/EMAILJS.md`.

**Resetting a forgotten admin:** if EmailJS isn't configured, recovery falls back to showing the 6-digit code in a browser pop-up. For a hard reset, open DevTools → Application → Local Storage → delete keys starting with `cartheon_auth_`.

---

## Data model

All data is `localStorage` JSON:

| Key | Purpose |
|---|---|
| `cartheon_auth_hash` | Master password hash |
| `cartheon_auth_salt` | PBKDF2 salt |
| `cartheon_auth_recovery_email` | Recovery address (hashed) |
| `cartheon_auth_recovery_code` | Active recovery code (hashed, expiry) |
| `cartheon_products` | Array of product objects |
| `cartheon_orders` | Array of order objects |
| `cartheon_cart` | Current visitor's cart (ephemeral) |

Admin edits write directly to these keys. No backend.

---

## Deployment

### Option A — Netlify (recommended, free)

1. Create a new site → "Deploy manually".
2. Drag-and-drop the entire `lume-store/` folder.
3. Once deployed, connect the custom domain (`cartheon.fr`) in Site Settings → Domain.
4. Netlify auto-issues a Let's Encrypt SSL cert.

Or connect the Git repo (if you push it to GitHub):

```bash
# one-time
git init
git add .
git commit -m "initial"
git remote add origin git@github.com:litza/cartheon-store.git
git push -u origin main
```

Then on Netlify → "Import from Git" → pick the repo. Every push to `main` auto-deploys.

### Option B — Vercel (free)

Same flow: import the Git repo. Zero-config deploys.

### Option C — GitHub Pages (free)

```bash
git push origin main
```

Then in GitHub repo → Settings → Pages → Source: `main`, folder `/ (root)`. Site live at `https://litza.github.io/cartheon-store/`. Custom domain: add a `CNAME` file with `cartheon.fr`, update DNS.

### Option D — OVH / Infomaniak hosting (French)

FTP/SFTP upload the folder to `www/`. Works with any static host.

---

## Environment variables

None. Everything is client-side. EmailJS keys are pasted directly into `emailjs-config.js`.

**Consequence:** secrets in this repo are **not secret**. Do not commit real API keys for services like Stripe. For Stripe, switch to a real backend (Shopify / server) before accepting payments.

---

## Testing

No test suite. Manual QA checklist per release:

- [ ] Storefront loads on cold `localStorage`
- [ ] Product card click → opens detail modal
- [ ] Add to cart → cart icon updates, cart drawer shows item
- [ ] Checkout form validates (email, phone, address)
- [ ] Admin login works, wrong password rejected
- [ ] Admin product CRUD persists to `localStorage`
- [ ] Recovery flow: "Forgot password" → code → reset → re-login
- [ ] Chatbot opens/closes, basic Q&A matches expected responses
- [ ] Track page loads with `?order=…` query param

Test on:
- Chrome desktop (primary)
- Safari macOS + iOS (Cormorant Garamond font rendering varies)
- Firefox
- Android Chrome (≥ mid-range device)

---

## Known limitations

- **Data lives only in the current browser.** Opening in another device = empty state. This is a dev harness, not a production store.
- **No server-side validation.** All security is client-side cryptography (PBKDF2 for passwords); fine for solo admin, not for public.
- **EmailJS keys visible in page source.** That's how EmailJS works; their server handles SMTP. Be aware your quota could be abused.
- **No analytics by default.** See `docs/business/BUSINESS_APPS.md` §5 for Plausible / GA4 installation.

---

## Moving to a real backend

When it's time (probably at first paying customer), migrate to:

1. **Shopify** — easiest, ~2 days to recreate the design. Keep admin panel logic as reference for data shape.
2. **WooCommerce** — keep WordPress hosting, migrate product data as CSV.
3. **Custom backend + Stripe** — Node/Express + PostgreSQL + this frontend as-is; ~1 week for one developer.

Until then, the static site is fine for showcasing and email-collecting.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Blank white screen | Missing `<script>` tag or JS error | Open DevTools Console |
| Admin login loops | Hash mismatch or cleared localStorage | Delete `cartheon_auth_*` keys, bootstrap again |
| Recovery email not arriving | EmailJS not configured | See `docs/setup/EMAILJS.md`, fallback popup will show |
| Chatbot unresponsive | `chatbot.js` didn't load | Check Network tab, verify path |
| Fonts look wrong | Google Fonts CDN blocked | Check browser extension (uBlock, Privacy Badger) |

---

**Last updated:** 16 April 2026.
