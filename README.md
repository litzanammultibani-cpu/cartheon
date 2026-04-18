# CARTHEON — Fine Silver Jewelry

**The Art of Timelessness**

CARTHEON is a fine sterling silver jewelry brand born in Strasbourg, France. Each piece is designed with intention — timeless silver jewelry made to last and meant to go everywhere with you.

Founders: **Litan Alexandru Răzvan** & **Cherif Sow**.

---

## Collections

- **Essential** — Minimalist everyday pieces.
- **Signature** — Statement chains and cuffs.
- **Éclat** — Limited edition luxury.

---

## Quick Start

```bash
# Run the site locally
npm start
# → http://localhost:8080
```

Full setup, deployment, and admin instructions: **[docs/setup/DEVELOPER.md](docs/setup/DEVELOPER.md)**.

---

## Documentation

All docs live in **[`docs/`](docs/README.md)**. Highlights:

| Doc | What |
|---|---|
| **[docs/README.md](docs/README.md)** | Full docs index + "where do I find…" map |
| [docs/setup/DEVELOPER.md](docs/setup/DEVELOPER.md) | Run, deploy, QA the site |
| [docs/setup/EMAILJS.md](docs/setup/EMAILJS.md) | Configure password recovery emails |
| [docs/suppliers/BRACELETS.md](docs/suppliers/BRACELETS.md) | 10 bracelet suppliers on Alibaba, ranked |
| [docs/suppliers/PACKAGING.md](docs/suppliers/PACKAGING.md) | Pouches, gift boxes, cards |
| [docs/suppliers/LINKS.md](docs/suppliers/LINKS.md) | All Alibaba URLs, categorized |
| [docs/business/BUSINESS_APPS.md](docs/business/BUSINESS_APPS.md) | Apps/tools stack for a French micro-entreprise |
| [docs/business/LEGAL_REQUIREMENTS.md](docs/business/LEGAL_REQUIREMENTS.md) | CGV, RGPD, TVA, REACH, hallmarking |
| [docs/business/LAUNCH_CHECKLIST.md](docs/business/LAUNCH_CHECKLIST.md) | 5-phase plan from localhost to first sale |

---

## Tech Stack

Static site — HTML5, CSS3 (responsive, mobile-first), vanilla JavaScript. Data lives in `localStorage`. No build step, no backend yet.

- `index.html` + `styles.css` + `script.js` — storefront
- `admin.html` + `admin.css` + `admin.js` — password-protected admin panel
- `chatbot.html`/`chatbot.css`/`chatbot.js` — customer chatbot
- `track.html` — order tracking
- `emailjs-config.js` — your EmailJS keys ([how](docs/setup/EMAILJS.md))

Fonts: Cormorant Garamond + Inter (Google Fonts).

---

## Deployment

Any static host works:

- **Netlify** — drag-and-drop the folder or connect the Git repo
- **Vercel** — import the repo
- **GitHub Pages** — push, enable Pages in Settings
- **OVH / Infomaniak** — FTP/SFTP to `www/`

Step-by-step in [docs/setup/DEVELOPER.md](docs/setup/DEVELOPER.md).

---

## License

MIT.

---

*CARTHEON — Strasbourg, France.*
