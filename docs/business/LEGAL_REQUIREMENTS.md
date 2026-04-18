# CARTHEON — French Ecommerce Legal Requirements

Plain-language guide for founders. Current to April 2026. Not legal advice — for large decisions (CGU disputes, CNIL complaints, customs), talk to a lawyer.

---

## Priority checklist

| Item | Required before 1st sale | Page on site |
|---|---|---|
| Company registered on guichet-unique.inpi.fr | Yes | — |
| SIRET received | Yes | — |
| URSSAF account active | Yes | — |
| Mentions légales | Yes | `/mentions-legales` |
| CGV (Conditions Générales de Vente) | Yes | `/cgv` |
| Politique de confidentialité (Privacy Policy) | Yes | `/confidentialite` |
| Cookie banner (CNIL-compliant) | Yes | Site-wide |
| Right-of-withdrawal form + info | Yes | `/retractation` |
| Right-of-withdrawal feature in customer journey | **By 19 June 2026** | Customer account |
| Business bank account | Recommended day 1, mandatory if >€10k/yr × 2 yrs | — |

---

## 1. Micro-entreprise registration (URSSAF)

The micro-entreprise (auto-entrepreneur) regime is the simplest legal wrapper for two founders selling physical goods.

### Steps

1. **Go to the Guichet Unique:** https://procedures.inpi.fr/ — the single gateway replacing all old forms since 2023.
2. Create an account for **each** founder (CARTHEON as a joint venture is tricky — see below).
3. Fill out the **déclaration de début d'activité** under "Activité commerciale" → "Vente de biens".
4. Auto-forwarded to:
   - **INSEE** → issues your **SIREN** (9 digits) and **SIRET** (14 digits) within ~15 days.
   - **URSSAF** → sends your affiliation notice within 4–10 weeks.
5. Once SIRET arrives, create an account at https://www.autoentrepreneur.urssaf.fr/ to declare turnover and pay social contributions.

### Two founders — structural choice

Micro-entreprise is **single-person only**. Options:

| Option | Pros | Cons |
|---|---|---|
| Each founder registers their own ME, splits profit informally | Simplest, free | No shared ownership, can't bill each other cleanly |
| One founder registers ME, other becomes employed helper | Clear ownership | Employment cost (URSSAF), slower to set up |
| **Create an SAS (société)** ★ recommended for 2-founder brands | Shared ownership, clean governance, enterprise credibility | ~€300 setup cost, bookkeeping more formal |
| SASU (single-person SAS), other founder as employee | Clean, can evolve to SAS | Slightly more paperwork than ME |

**Recommendation for CARTHEON:** Register as **ME under Litan's name first** to validate demand (€0 cost, works this week). **Once monthly revenue > €2,000**, create an SAS jointly. Meantime, a written founder agreement (even a Notion page) covers profit split and IP ownership.

Social contributions for ME selling goods: **12.3% of turnover** (2026 rate). No turnover = no contribution. Declarations are monthly or quarterly.

Source: [economie.gouv.fr](https://www.economie.gouv.fr/particuliers/vie-en-entreprise/comment-devenir-micro-entrepreneur-auto-entrepreneur), [URSSAF auto-entrepreneur](https://www.autoentrepreneur.urssaf.fr/).

### From 1 September 2026

Micro-entrepreneurs must be able to **receive electronic invoices** via an approved dematerialization platform (PDP or PPF). You don't need to **send** e-invoices yet. Choose from approved providers like Tiime, Indy, or Sage.

---

## 2. TVA (VAT)

### Franchise en base de TVA — your starting regime

While turnover is under the thresholds, you're **exempt from charging or declaring TVA**. You don't register as a TVA-payer. The Senate confirmed in late 2025 that thresholds remain:

| Activity | Threshold (N-1) | Ceiling (N) |
|---|---:|---:|
| **Sales of goods** (your case) | €85,000 | €93,500 |
| Services | €37,500 | €41,250 |

Crossing the ceiling **mid-year** makes TVA apply immediately from the 1st day of the month of crossing — not next year.

### On every invoice

Legally required while under the threshold:

> **TVA non applicable, art. 293 B du CGI**

You charge the listed price, no TVA added. You also **cannot deduct TVA on business purchases** (the trade-off).

### If you cross the threshold

- Apply for a **numéro de TVA intracommunautaire** (via service des impôts).
- Add 20% TVA to goods sold in France.
- Charge variable TVA on B2C sales to other EU countries (depends on each country's rate) **unless you use the OSS (One-Stop-Shop)** regime.
- File TVA declarations (CA3) monthly or quarterly.

### Exports

- **Outside EU (e.g. US, UK, Swiss):** VAT-free, mark invoice "Exonération TVA, art. 262 I du CGI". Customer pays import VAT at destination.
- **B2C inside EU under €10,000/yr total cross-border sales:** French TVA rate applies (once you're TVA-registered).
- **B2C inside EU over €10,000/yr:** register for **OSS-IOSS** to declare each country's VAT in one French filing.

Sources: [Service Public — franchise en base](https://entreprendre.service-public.gouv.fr/vosdroits/F21746), [Indy 2026 VAT reform guide](https://www.indy.fr/blog/unification-seuils-tva-2026/), [economie.gouv.fr on VAT franchise](https://www.economie.gouv.fr/entreprises/gerer-sa-fiscalite-et-ses-impots/autres-impots-et-taxes/entreprises-pouvez-vous-beneficier-de-la-franchise-de-tva).

---

## 3. Mentions légales (mandatory on every site)

Required by **Loi pour la Confiance dans l'Economie Numérique (LCEN, 2004)**. Non-compliance = up to 1 year prison + €75,000 fine (personal) / €375,000 (company).

Must appear on a dedicated page easily reachable from the footer:

- Legal name of owner: **"Litan Alexandru Răzvan, entrepreneur individuel (EI)"**
- Postal address
- Contact email + phone
- SIRET number
- If applicable: RCS registration city + number
- Director of publication (for blogs/content)
- **Host provider:** full legal name, address, phone of your hosting company
  - GitHub Pages → GitHub Inc., 88 Colin P. Kelly Jr Street, San Francisco, CA 94107
  - Netlify → Netlify Inc., 2325 3rd Street #296, San Francisco, CA 94107
  - Vercel → Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789
  - OVH → 2 rue Kellermann, 59100 Roubaix, France
- If you process payments: mention of CGV and data processor
- For jewelry specifically, if you claim precious metal content: reference to **contrôle des métaux précieux** (see §6).

Template generator: https://www.donneespersonnelles.fr/mentions-legales (free).

Source: [Service Public — mentions obligatoires](https://entreprendre.service-public.gouv.fr/vosdroits/F31228), [francenum.gouv.fr](https://www.francenum.gouv.fr/guides-et-conseils/developpement-commercial/site-web/quelles-sont-les-mentions-legales-pour-un-site).

---

## 4. CGV — Conditions Générales de Vente

Mandatory for any B2C seller. Non-compliance = €3,000 fine (individual) / €15,000 (company) per missing clause.

### Minimum content

1. **Identification** — same as mentions légales (name, SIRET, address).
2. **Product characteristics** — description, composition (925 silver), origin country, weight.
3. **Prices** — all-taxes-included, free-shipping threshold, shipping costs detailed.
4. **Payment methods accepted** — Stripe, PayPal, etc.
5. **Delivery terms** — carriers, timeframes, what happens if delayed.
6. **Right of withdrawal** — see §7 below.
7. **Legal warranties** — **garantie légale de conformité (2 years)** + **garantie contre les vices cachés**. Must be stated verbatim per Code de la consommation art. L217-3 et seq.
8. **After-sales service** — contact, response time.
9. **Dispute resolution** — mention of consumer mediator (see §9).
10. **Applicable law** — French law.

Template: https://www.siteconforme.fr/ or generate via Shopify / WooCommerce plugin.

**Don't copy a competitor's CGV wholesale** — it's copyrighted and likely doesn't fit your exact offer.

Source: [Keobiz CGV guide 2026](https://www.keobiz.fr/le-mag/condition-generale-vente-e-commerce/), [martin.avocat.fr](https://martin.avocat.fr/cgv-cgu-mentions-legales-differences/).

---

## 5. Privacy Policy (RGPD / GDPR)

Required the moment you collect any personal data (contact form, newsletter, account, analytics, payment).

### Must disclose

- **What data** you collect (name, email, IP, order history, cookies).
- **Why** (legal basis: contract, consent, legitimate interest).
- **Retention period** (e.g. orders 10 yrs for accounting, newsletter until unsubscribe).
- **Recipients** (Stripe, Brevo, Sendcloud…).
- **Transfers outside EU** (if any — e.g. Google Analytics to US).
- **User rights:** access, rectification, erasure, opposition, portability, restriction.
- **How to exercise rights** — contact email + reference to CNIL.
- **Cookie policy** — list of cookies, purpose, duration, opt-out method.

Template: https://www.cnil.fr/fr/rgpd-par-ou-commencer (free) or Shopify auto-generated.

---

## 6. Cookie banner (CNIL rules)

Since 2020, CNIL requires:

- **No cookies before consent** except strictly necessary (session, cart).
- A banner with **both** "Accept all" AND "Reject all" at the same level, same size, same color weight.
- An accessible "cookie preferences" link to change choice later.
- Refusal must be as easy as acceptance (no dark patterns).
- Consent logged with timestamp.
- Applies to analytics cookies too (Google Analytics, Hotjar, Meta Pixel).

**Easy implementation:**
- Shopify: GDPR Cookie Bar app (free tier available)
- WordPress: CookieYes / Complianz
- Static site: Klaro! (open source, free) https://heyklaro.com/
- Plausible Analytics: **no banner required** (no personal data collected)

CNIL fines in 2026 reach **€375,000** for non-compliant sites.

Sources: [CNIL — règles cookies](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies), [CNIL 2026 recommendation PDF](https://www.cnil.fr/sites/default/files/2026-01/recommandation_cookies_consolidee.pdf).

---

## 7. Right of withdrawal (14 days)

Any B2C distance sale grants the consumer a **14-day withdrawal period**, no reason required, starting from delivery.

### Must provide

- Clear info on the right **before** sale (CGV + order page).
- A **withdrawal form** (type form at [Annexe L221-1 CC](https://www.legifrance.gouv.fr/)).
- Clear address for returns.
- Refund within **14 days** of notification (you can hold until you receive the returned goods).

### Critical 2026 update

**Ordinance n°2026-2 of 5 January 2026, applicable 19 June 2026**: you must provide a **dedicated feature in the customer journey** (not just info in CGV) to exercise the withdrawal right. One-click button from the customer's account, essentially.

Shopify is rolling out a module for this mid-2026; WooCommerce has community plugins.

Source: [TGS France Avocats — nouvelle obligation droit de rétractation](https://www.tgs-avocats.fr/blog/e-commerce-nouvelle-obligation-droit-de-retractation).

### Exceptions (where withdrawal doesn't apply)

- Custom-made / personalized items — engraving makes a bracelet non-returnable. **State this clearly before purchase**.
- Sealed hygiene items — N/A for jewelry.

---

## 8. Business bank account

- Legally mandatory for ME only if turnover exceeds **€10,000/year for 2 consecutive years** (Code monétaire et financier art. L123-24).
- Practically needed from day 1 for Stripe, URSSAF automatic débit, and clean bookkeeping.
- See BUSINESS_APPS.md §2 for provider comparison.

---

## 9. Mediator for consumer disputes

Required since 2016 (Loi n°2015-1541). You must:

- Subscribe to a **médiateur de la consommation** (approved mediator).
- Publish their contact on your site and in CGV.

Options for ecommerce:
- **FEVAD / Médiateur du e-commerce**: https://www.mediateurfevad.fr/ (€200–500/year)
- **CM2C**: https://www.cm2c.net/ (~€150/year first year, then per case)
- **CNPM**: https://www.cnpm-mediation-consommation.eu/

Pick one, subscribe, add their info to CGV. Without one, consumer claims can escalate directly to courts.

---

## 10. Product safety & labeling (Jewelry-specific)

### REACH / Nickel Directive

All jewelry sold in the EU is subject to **REACH Regulation (EC) No 1907/2006 Annex XVII, item 27**, which limits nickel release:

- **0.2 μg/cm²/week** for anything inserted in pierced skin (posts, earrings).
- **0.5 μg/cm²/week** for items in prolonged skin contact (bracelets, rings).

Testing standard: **EN 1811:2023**. Your supplier must provide a **REACH conformity declaration**. Ask Yilun explicitly — any reputable 925-silver supplier will have this on file.

### Lead and cadmium

REACH also caps lead (<0.05%) and cadmium (<0.01%) in jewelry metal.

### Hallmarking

France requires all jewelry sold with a precious-metal claim (silver ≥925, gold ≥375) to be **poinçonnée** (hallmarked). This is handled by the **Bureau de la Garantie** (via Douanes/DGDDI):

- Weight ≤30g: hallmarking voluntary for sale below a threshold, but **declaration at import** is mandatory.
- Importing from China (Alibaba suppliers): declare with DEB/EMEBI form at customs, request a **convention de garantie** with DGDDI for simplified hallmarking.
- For pieces <30g, many French brands use a **poinçon de maître** (own mark registered with DGDDI) + the 925 fineness stamp. Registration: ~€280 one-time.

Reference: https://www.douane.gouv.fr/ for the exact procedure. This is the one area where retaining a specialist (expert-comptable or customs broker) at €100–200 one-time is money well spent.

### CE marking

Jewelry **does not require CE marking** unless it contains electronic components (smart jewelry) or is a medical device.

### Labels on packaging

- Origin: "Made in China" (or wherever). Don't hide it.
- Material: "925 sterling silver" / "Argent massif 925/1000".
- Language: **French** must be present (Loi Toubon). Bilingual FR/EN is fine.

Sources: [ComplianceGate EU jewellery regulations](https://www.compliancegate.com/jewelry-products-regulations-european-union/), [Foresight EU nickel standards](https://www.useforesight.io/news/new-eu-standards-for-nickel-release-in-consumer-products).

---

## 11. Data retention rules

| Data | Retention |
|---|---|
| Invoices & accounting records | 10 years |
| Customer contracts | 5 years |
| Cookies (non-essential) | 13 months max |
| Newsletter subscribers | Until unsubscribe + 3 years proof |
| Stripe / payment logs | Stripe handles; you keep the last 3 years |
| CVs from job applicants | 2 years (with their consent), then purge |

---

## 12. Minimum viable legal pack (what to ship)

Create these pages **before** accepting the first real payment:

- [ ] `/mentions-legales` — identity + host
- [ ] `/cgv` — full sales conditions
- [ ] `/confidentialite` — privacy policy
- [ ] `/retractation` — withdrawal form + info
- [ ] Cookie banner installed, tested (accept + reject options)
- [ ] Link to all 4 pages in the footer of every page
- [ ] Mediator contact in CGV
- [ ] Email address `contact@` or `hello@` set up
- [ ] SIRET visible in footer + on invoices
- [ ] "TVA non applicable, art. 293 B du CGI" on every invoice

Budget: €0 using free generators; ~€200 if you want a lawyer to review the pack once (recommended).

---

**Last updated:** 16 April 2026. Laws change — re-verify CNIL and Service Public before going live.
