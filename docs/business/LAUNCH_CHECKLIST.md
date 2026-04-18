# CARTHEON — Launch Checklist

From today (localhost) to first paying customer. Pragmatic, calendar-driven. Every item tickable. Assumes ~2 hours/day total between the two founders.

---

## Phase 1 — This Week (days 1–7)

Foundations. Zero money spent on production; this is all setup.

### Paperwork
- [ ] Create accounts on guichet-unique.inpi.fr (Litan, primary registrant)
- [ ] File déclaration de début d'activité (micro-entreprise → vente de biens)
- [ ] Write a short founder agreement (Notion page): 50/50 profit split, 50/50 IP, roles
- [ ] Open Shine Free business account (awaits SIRET, but start the application)

### Domain & identity
- [ ] Buy `cartheon.fr` on OVH or Gandi (~€9/yr)
- [ ] Reserve `@cartheon_paris` or `@cartheon.official` on Instagram + TikTok (check availability first; CARTHEON/ Cartheon is common)
- [ ] Reserve same handle on Pinterest
- [ ] Create Google account `hello.cartheon@gmail.com` as placeholder until domain email is live

### Supplier outreach
- [ ] Create Alibaba account (free)
- [ ] Favorite all 10 bracelet products from `docs/suppliers/LINKS.md`
- [ ] Send opening message to Guangzhou Yilun (template in `BRACELETS.md`)
- [ ] Message A1 Packing (pouches) — request logo print sample quote

### Tech prep
- [ ] Deploy the current static site to Netlify on the new domain as a "coming soon"
- [ ] Set up a basic email signup form (Brevo embed) to start building a pre-launch list

**End of week check:** SIRET pending, domain live, supplier conversation open, waiting list collecting emails.

---

## Phase 2 — Next 2 Weeks (days 8–21)

Samples arrive, photography happens, brand sharpens.

### Sample order
- [ ] Confirm total + shipping with Yilun
- [ ] Place Scenario A sample order via Trade Assurance (2 paperclip + 2 tennis ≈ €57–67)
- [ ] Track shipment (expect 10–15 days to Strasbourg)

### Content prep (while samples are in transit)
- [ ] Write 10 Instagram post captions (French + English, rotate)
- [ ] Shoot lifestyle mood-board photos (free stock + your own moodboards)
- [ ] Record 3 "brand story" TikTok drafts (face optional — hands/close-ups work)
- [ ] Draft copy for: `/about`, `/cgv`, `/retractation`, `/mentions-legales`, `/confidentialite`
- [ ] Build a simple Notion help center (`help.cartheon.fr` via Notion public link)

### Legal prep
- [ ] Choose a mediator subscription (~€150/yr — FEVAD or CM2C)
- [ ] Generate cookie banner config (Klaro! or Complianz)
- [ ] Install Plausible Analytics on the site

### Financial prep
- [ ] Once SIRET arrives: activate URSSAF account, link Shine
- [ ] Install Indy (free) and connect Shine
- [ ] Register `@` for `hello@cartheon.fr` — Infomaniak kSuite Standard, 2 mailboxes (~€9/mo)

### Sample arrival — QC day
- [ ] Weight test (compare to stated grams)
- [ ] Verify "925" hallmark on each piece
- [ ] Silver test drop (buy €5 test kit from Amazon FR)
- [ ] Clasp stress test (open/close 50×)
- [ ] Photograph every defect (for Alibaba dispute if needed)
- [ ] Give it a body test — wear it 48 hours, check for tarnish or skin reaction

**End of phase 2 check:** samples in hand, QC passed, brand pages drafted, legal pages in review.

---

## Phase 3 — After Products Arrive (weeks 4–6)

Payment stack, real photos, first inventory.

### Production order (Scenario B)
- [ ] Send CARTHEON `logo.svg` to Yilun for engraving
- [ ] Confirm hang tag design (approve digital proof)
- [ ] Place order: 30 paperclip chains, engraved, hang-tagged (~€220)
- [ ] Order A1 pouches (500 units, ~€50)
- [ ] Order gift boxes (30 units, ~€9)
- [ ] Order 50 thank-you cards from VistaPrint (~€8)

### Photography
- [ ] Clean workspace, white paper backdrop, ring light
- [ ] Shoot product photos: 6 angles × 30 pieces — hero white + 3 lifestyle per SKU
- [ ] Remove backgrounds with Photoroom
- [ ] Light color correction in Lightroom Mobile
- [ ] Upload to Google Drive → replace placeholder symbols on CARTHEON site

### Payment stack
- [ ] Activate Stripe — verify bank, upload CNI, link to SIRET
- [ ] Activate PayPal Business — same documents
- [ ] Decide: stay on static site w/ Stripe Checkout link, OR migrate to Shopify Basic (€36/mo, fastest)
- [ ] Set up Sendcloud free — connect Mondial Relay + Colissimo

### Legal pack live
- [ ] Publish `/mentions-legales`, `/cgv`, `/confidentialite`, `/retractation`
- [ ] Mediator footer link
- [ ] Cookie banner live + tested on mobile
- [ ] Age/consent checkbox on newsletter form

### Admin panel sanity check
- [ ] Change admin password, back up recovery email
- [ ] Configure EmailJS for real recovery (see `docs/setup/EMAILJS.md`)
- [ ] Seed the admin with real product data (from Yilun's production run)
- [ ] Test full order flow end-to-end with a €0.50 test order (Stripe test mode)

**End of phase 3 check:** products in hand, site live with real photos, payment + shipping + legal in place.

---

## Phase 4 — Launch (week 7)

Soft → wide. Two beats.

### Soft launch (day 1–3)
- [ ] Personal messages to 30 friends/family (WhatsApp / email) with the link
- [ ] 10% discount code "FOUNDERS" for first orders
- [ ] Ask for orders + honest feedback (design, checkout, delivery)
- [ ] Each order placed = screenshot for Instagram story ("our 1st customer!")

### First-order survival checks
- [ ] Ship within 24h of order
- [ ] Send tracking manually via Stripe/Shopify receipt
- [ ] Follow up 2 days after delivery: "Does it fit? Photo welcome"
- [ ] Collect 5 testimonials — ask explicitly for permission to post

### Wide launch (day 4–7)
- [ ] Announce post on Instagram (grid post + 3 stories)
- [ ] TikTok unboxing video from a friend's perspective (UGC)
- [ ] Pinterest pins of lifestyle photos (low effort, high evergreen traffic)
- [ ] Email the waiting list: "We're live. 10% off for 48 hours. Link."
- [ ] Post in 2 Strasbourg Facebook groups (if allowed)
- [ ] Submit to 1 French DTC product directory (e.g. myfrenchcountryhome)

**End of phase 4 check:** 5+ orders shipped, testimonials in hand, everyday operations running.

---

## Phase 5 — First 30 Days (weeks 8–12)

Double down on what works.

### Data review (weekly)
- [ ] Plausible: which pages convert? Which products get viewed but not bought?
- [ ] Clarity: session recordings — where do users rage-click or bounce?
- [ ] Bank: match every Stripe payout against URSSAF declarable revenue
- [ ] Indy: categorize expenses weekly (don't let them pile)

### Inventory loop
- [ ] Re-order as soon as stock drops to 5 units of a SKU (Yilun lead time ≈ 3 weeks)
- [ ] If paperclip chain is selling, order 60 more — unlock €5.99 unit price
- [ ] Introduce 2nd hero product (tennis bracelet) at 30-unit order

### Marketing iteration
- [ ] 2 Instagram posts + 3 stories/week minimum
- [ ] 1 TikTok/week, tracked
- [ ] A/B test 2 email subject lines per campaign
- [ ] Measure: email open rate > 25%? Click rate > 2%? → keep; else reformat

### Customer retention
- [ ] Set up Brevo automation: order confirmation → shipped → thank-you + 10% off repeat order (day 7 post-delivery)
- [ ] Add "leave a review" prompt email on day 14
- [ ] Ask best 3 customers for UGC permission → repost to Instagram

### Upgrade triggers (spend only if hit)
- [ ] €1k MRR → Canva Pro (€12/mo)
- [ ] €3k MRR → real accountant (~€50–80/mo), keeps Indy
- [ ] €5k MRR → Klaviyo migration
- [ ] 500+ orders/mo → Shopify Basic (if not already on it) + Crisp Pro

### Decision points
- [ ] At day 30: do a 2-founder review. What to keep / kill? Pivot SKUs if heart bracelet outsells tennis 3:1.
- [ ] Start a "lessons" doc in Notion. Every mistake = 1 entry.

---

## The Minimum Viable Launch Budget

| Item | Cost |
|---|---:|
| Domain (1 yr) | €9 |
| Yilun sample order | €60 |
| Yilun production order (30 pcs) | €220 |
| Pouches (500) | €50 |
| Gift boxes (30) | €9 |
| Thank-you cards | €8 |
| Mediator subscription | €150 |
| Infomaniak email (3 months) | €27 |
| Plausible (3 months) | €27 |
| Buffer for shipping, test orders, contingencies | €40 |
| **Total** | **~€600** |

Founders' starting budget is €160. Gap to close: €440. Options:
- Skip Phase 1 wide brand investments; keep static site on Netlify (free), no Infomaniak immediately (use Gmail), skip Plausible (use GA4 + banner).
- Pre-sell: 5 friends at €32 each = €160, covers Phase 1 sample. Re-invest as Phase 2 kicks in.
- Revenue from first 8 orders of Phase 4 covers phase 3 outlay.

---

**Last updated:** 16 April 2026. Adjust dates; the sequence holds.
