# CARTHEON — Fulfilment Runbook

The day-by-day workflow for turning a placed order into a delivered piece.

---

## 1. Daily checklist (Mon–Fri, ~20 min)

At a fixed time each day (e.g. 09:30 CET):

1. **Open admin** — `admin.html` → filter for `Pending payment` and `Paid — pending shipment`
2. **Confirm payment** for any `Pending payment` orders (Stripe/PayPal dashboard or bank notification)
3. **For each `Paid` order**: pick → pack → label → ship (§ 2–4 below)
4. **Mark as `Shipped`** in admin with tracking number + carrier
5. **Send shipping confirmation email** (manual for now; automated once EmailJS template is wired)

Promise to customer: **ship within 48 hours**. Fulfil within 1 business day if possible.

---

## 2. Pick

For every order, print or note:

- Order number (e.g. `#1037`)
- Customer name
- SKUs with quantities (e.g. `celeste-chain × 1`, `aurora-bangle × 2`)
- Engraving text if present
- Gift message if present

Pull each piece from inventory and double-check SKU against the order line. **SKU mismatch is the #1 source of returns.**

### Inventory per SKU
| SKU              | Piece                     | Location  | Reorder at |
| ---------------- | ------------------------- | --------- | ---------- |
| celeste-chain    | Céleste Chain Bracelet    | Shelf A1  | 5 units    |
| infiniti-cuff    | Infiniti Cuff             | Shelf A2  | 3 units    |
| aurora-bangle    | Aurora Bangle             | Shelf A3  | 5 units    |
| etoile-charm     | Étoile Charm Bracelet     | Shelf B1  | 3 units    |
| lune-tennis      | Lune Tennis Bracelet      | Shelf B2  | 3 units    |
| mira-paperclip   | Mira Paperclip Chain      | Shelf B3  | 5 units    |
| solis-beaded     | Sólis Beaded Bracelet     | Shelf C1  | 5 units    |
| sienna-heart     | Sienna Heart Bracelet     | Shelf C2  | 5 units    |

> Update locations and reorder levels to match your actual stockroom.

---

## 3. Pack

Every CARTHEON order ships **gift-ready**. Standard pack for a single piece:

1. Inspect the piece under good light — no tarnish, no scratches, clasp opens/closes cleanly
2. Polish with cloth if needed (5–10 s pass)
3. Place piece in **CARTHEON pouch** — logo facing up, drawstring tied
4. Add **polishing cloth** (branded, one per pouch)
5. Add **care card** (sterling silver care instructions + 14-day return reminder)
6. Add **handwritten thank-you note** if it's an engraved order, a gift, or the customer's first order
7. Place pouch inside the **kraft mailer box** (one size fits all current pieces)
8. For 2+ pieces: each in its own pouch, all inside one box with tissue paper

### For gifts
- If a gift message is in `notes`, copy it onto a small card — **do not print the invoice**
- Remove or cross out price on any included paperwork
- Use the unbranded return label if the customer requested discreet shipping

### Sealing
- Box closed with kraft tape
- Gold foil CARTHEON sticker on the seam (do not skip — this is the brand moment)

---

## 4. Ship

### Carriers by destination

| Destination           | Carrier                | Service              | Transit   | Threshold for insurance |
| --------------------- | ---------------------- | -------------------- | --------- | ----------------------- |
| France                | La Poste               | Lettre suivie        | 3–5 d     | > €50 → Colissimo       |
| France (> €100)       | Colissimo              | Domicile avec suivi  | 2–3 d     | signed delivery         |
| EU (< €50)            | La Poste               | International suivi  | 5–7 d     | —                       |
| EU (> €50)            | Mondial Relay / DHL    | Point relais / Express | 3–7 d   | up to €500              |
| UK                    | La Poste International | Suivi + CN22         | 4–7 d     | —                       |
| US / Canada           | Colissimo Intl         | Suivi + CN23         | 7–12 d    | signed for > €80        |
| ROW                   | DHL Express            | Worldwide            | 5–10 d    | always                  |

### Customs (non-EU)
- Under €22: CN22 label — no duty for most destinations (UK post-Brexit still needs it)
- €22–€150: CN22 + commercial invoice
- > €150: CN23 + commercial invoice; may trigger import VAT

**Always declare the full sale price** — undervaluing parcels is fraud and voids insurance.

### Labels
1. Log into La Poste Pro / DHL MyBill with order details
2. Copy the shipping address exactly as entered — do not "correct" it
3. Sender: `CARTHEON, [your address], 67000 Strasbourg, France`
4. Print label, affix to the sealed box
5. Photograph the labelled box before drop-off (proof of condition)

### Drop-off
- La Poste: nearest bureau de poste or yellow mailbox (Lettre suivie)
- Colissimo: point relais or bureau
- DHL: DHL ServicePoint or scheduled pickup

Keep the tracking receipt — **until the package is delivered, it's our risk.**

---

## 5. Post-ship

1. In admin, move order to **`Shipped`** with:
   - `trackingNumber`
   - `carrier` (e.g. `La Poste`, `Colissimo`, `DHL`)
   - `trackingUrl` (e.g. `https://www.laposte.fr/outils/suivre-vos-envois?code=XXXX`)
2. Send the shipping confirmation email (include tracking link)
3. Add expected delivery date to your calendar — if no delivery by D+3 past the ETA, check the tracking and email the customer proactively

### When the customer marks `Delivered`
- Nothing to do — the 14-day withdrawal window starts from the delivery date
- Internally: move to `Delivered` status after ~5 days (or when tracking confirms)

---

## 6. Exceptions

| Situation            | Action                                                                              |
| -------------------- | ----------------------------------------------------------------------------------- |
| Out of stock         | Email within 12 h: offer a similar piece, a pre-order with +7 d, or a full refund   |
| Wrong item shipped   | Send correct item same-day at our cost; provide prepaid return label                |
| Damaged on arrival   | Photos → replace or refund; cover return shipping (see returns policy)              |
| Address invalid      | Email once within 12 h; wait 24 h; if no reply, cancel + refund                     |
| Customs held         | Customer handles duty; we provide commercial invoice if needed                      |
| Lost in transit      | Claim with carrier after the service's max transit + 5 business days                |
| Chargeback           | Respond within carrier's window with proof of shipment + delivery                   |

---

## 7. Metrics to track

Weekly, from admin data:

- Orders placed · Orders shipped · % shipped within 48 h target
- Average pick-to-ship hours
- Return rate (by SKU, by country)
- Damage rate in transit (by carrier)
- Stock at reorder level

Once you have 20+ orders, the carrier mix and stock levels should be re-evaluated.
