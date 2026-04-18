# CARTHEON — Apps & Tools Stack

Guide for what CARTHEON actually needs to run as a French micro-entreprise e-commerce brand. Researched April 2026. Budget mindset: **free or lowest paid tier first**, upgrade only when revenue justifies it.

Founders budget: €80 each → €160 shared runway. Every tool below is chosen to keep fixed costs near zero until paying customers arrive.

---

## Summary — "Day 1" starter stack (all free)

| Category | Pick | Monthly cost |
|---|---|---:|
| Bookkeeping | Indy (free tier) | €0 |
| Bank (business) | Shine Free | €0 |
| Invoicing | Indy or Tiime | €0 |
| Email marketing | Brevo (free) | €0 |
| Transactional email | Resend free (already via EmailJS for now) | €0 |
| Business email | Infomaniak kSuite (delay until domain is live) | ~€4.59 |
| Analytics | Google Analytics 4 + Microsoft Clarity | €0 |
| Social scheduling | Metricool free | €0 |
| Live chat | Crisp free (2 seats) | €0 |
| Productivity | Notion free + Google Drive | €0 |
| Design | Canva Free + Photoroom free | €0 |
| Payment processor | Stripe (no monthly fee, per-transaction only) | €0 |
| **Total recurring** | | **~€5/mo** |

Everything else on this page is "add when you need it".

---

## 1. Accounting & Tax (French micro-entreprise)

Under the micro-entreprise (auto-entrepreneur) regime, bookkeeping is lightweight: you track revenue in a "livre de recettes", declare turnover to URSSAF monthly or quarterly, and stay under the VAT franchise threshold (€85,000 for sales of goods in 2026). Starting **1 September 2026**, micro-entrepreneurs must be able to **receive** electronic invoices via an approved platform (not send yet — sending mandate phases in later).

### Bookkeeping software

| Tool | Free tier | Best for | Link |
|---|---|---|---|
| **Indy** ★ recommended | Yes — full free plan | Micro-entreprise: auto-imports bank transactions, auto-categorizes, generates URSSAF declarations | https://www.indy.fr/ |
| Tiime | Yes — free invoicing | Mobile-first, clean UI, AI receipt scanning | https://www.tiime.fr/ |
| Georges | Paid only (~€20/mo) | Full-service with a real accountant assigned | https://www.georges.tech/ |
| Shine | Bundled with bank account | Simplest if you already use Shine for banking | https://www.shine.fr/ |
| Qonto | Bundled with bank account | Use if you're on Qonto; integrates accounting | https://qonto.com/ |

**Recommendation:** Start with **Indy free** for bookkeeping + **Shine free** for the bank account. They're separate but interoperate. Consolidate later if one tool wins.

Sources: [Weepo freelance accounting top 8](https://weepo.fr/en/blog/logiciel-compta-pour-freelance-decouvrez-notre-top-8), [Stripe guide to French freelance software](https://stripe.com/resources/more/must-have-software-for-self-employed-professionals-in-france).

### Invoice generator

Indy and Tiime both include unlimited free invoicing with French legal fields (SIRET, TVA non applicable art. 293B, mentions légales). No separate tool needed at this stage.

French invoices must show:
- Your SIRET, full legal name, and address
- Invoice number (sequential)
- Date
- Description of goods, quantity, unit price
- The statement **"TVA non applicable, art. 293 B du CGI"** (while you're under the VAT threshold)
- Payment terms + late-payment penalty clause

### Expense tracking

Indy handles this — snap a receipt, it auto-categorizes. No separate app needed.

---

## 2. Banking

Micro-entreprises don't strictly need a dedicated pro account until turnover exceeds **€10,000/year for two consecutive years** (French law), but every serious brand should open one from day one to separate personal and business money.

| Bank | Free tier | Fees | Best for | Link |
|---|---|---|---|---|
| **Shine** ★ recommended | Yes (Shine Free) | 1 card, unlimited invoices, 5 transfers/mo free | Solo/duo founders, simplicity | https://www.shine.fr/ |
| Qonto | No free tier | From €9/mo annual billing, 30 transfers | Structured SMEs, multi-user | https://qonto.com/fr/ |
| Revolut Business | No free tier | From €10/mo | Multi-currency, international | https://www.revolut.com/business/ |
| N26 Business | Free tier (personal-ish) | Limited for real business use | Occasional freelancers only | https://n26.com/fr-fr/business |

All accept capital deposit (Shine and Qonto do — Revolut Business doesn't). IBAN is **FR-prefixed** on Shine and Qonto; Revolut issues a Lithuanian IBAN which some French suppliers/buyers still flag as "foreign". For a French-market brand, FR-IBAN matters for trust.

**Recommendation:** Open **Shine Free**. Upgrade to Qonto only if you outgrow Shine's 5 transfers/month or need invoice automation.

Sources: [Qonto vs Shine vs Revolut comparison](https://qonto.com/fr/blog/qonto/compte-pro-vs-banques/shine-vs-qonto-vs-revolut), [Heropay Shine vs Qonto vs Revolut](https://www.heropay.eu/fr/blog/shine-vs-qonto-vs-revolut-business).

---

## 3. Ecommerce Platform (graduation from localhost)

The current site is static HTML/CSS/JS — perfect for dev, not for real checkout. When you're ready for paying customers, pick one:

| Platform | Monthly cost | TCO/year | Best for | Link |
|---|---|---|---|---|
| **Shopify** ★ recommended for speed | From €36/mo Basic | €4,000–15,000 | Founders who want to ship in 2 weeks, not 2 months | https://www.shopify.com/fr |
| WooCommerce (WordPress) | Hosting ~€20–80/mo | €2,500–7,000 | Brands that want SEO control and unlimited customization | https://woocommerce.com/ |
| PrestaShop | Hosting ~€15–60/mo | €3,000–8,000 | French-market open-source, dense module ecosystem | https://www.prestashop.com/fr |
| Webflow + Snipcart | Webflow €23 + 2% per sale | ~€500 first year | Design-heavy brands prioritizing visual storytelling | https://webflow.com/ + https://snipcart.com/ |

**Recommendation:** Shopify Basic. Two founders with no dev bandwidth for self-hosted maintenance; Shopify handles PCI, hosting, updates, and has a direct Stripe/PayPal/Klarna integration. Shopify transaction fee (0.5–2%) is avoidable by enabling Shopify Payments.

Caution: Shopify's true TCO balloons with apps. Keep the app list to 3–5 critical ones.

Sources: [SPACOMA 2026 comparison](https://www.spacoma.fr/prestashop-woocommerce-shopify-comparatif-2026/), [Litextension](https://litextension.com/blog/prestashop-vs-shopify/).

---

## 4. Email

### Transactional email (order confirmations, password resets)

The current site uses **EmailJS** (200 free emails/month) — fine for localhost. Upgrade when you hit a real checkout.

| Tool | Free tier | Best for | Link |
|---|---|---|---|
| **Resend** ★ recommended | 3,000/mo (12 months), then €20/mo for 50K | Modern, developer-friendly, easy DKIM/SPF | https://resend.com/ |
| Brevo | 300/day (transactional + marketing combined) | If you also use Brevo for marketing | https://www.brevo.com/ |
| Mailgun | Pay-as-you-go €2/1000 | High volume, routing logic | https://www.mailgun.com/ |
| SendGrid | 60-day trial only | Legacy choice, no longer has free | https://sendgrid.com/ |
| Postmark | 100/mo free | Best deliverability, slightly higher cost | https://postmarkapp.com/ |

**Recommendation:** Stay on EmailJS until you migrate to Shopify or a real backend. Then Resend.

Source: [Email API pricing comparison April 2026](https://www.buildmvpfast.com/api-costs/email).

### Email marketing (newsletter, abandoned cart, promotional)

| Tool | Free tier | Best for | Link |
|---|---|---|---|
| **Brevo** (ex-Sendinblue) ★ recommended | 300 emails/day, unlimited contacts | French-built, cheap, combines marketing + transactional | https://www.brevo.com/ |
| MailerLite | 1,000 subscribers, 12K emails/mo | Clean editor, simplest onboarding | https://www.mailerlite.com/ |
| Klaviyo | 250 subs, 500 emails/mo | Industry standard once you hit $50K/mo revenue | https://www.klaviyo.com/ |
| Mailchimp | 500 subs, 1,000 emails/mo | Most recognizable brand, but overpriced now | https://mailchimp.com/ |

**Recommendation:** Start **Brevo free**. French company, HQ in Paris — easy GDPR compliance. Migrate to **Klaviyo** when monthly email-attributed revenue exceeds €5,000 (not before).

Sources: [Omnisend comparison](https://www.omnisend.com/blog/brevo-vs-mailerlite/), [MailToolFinder 2026 pricing](https://mailtoolfinder.com/blog/email-marketing-pricing-comparison-2026/).

### Business email (contact@cartheon.fr etc.)

| Provider | Cost/user/mo | Why | Link |
|---|---|---|---|
| **Infomaniak kSuite** ★ recommended | From €4.59/mo annual | Swiss-hosted (GDPR+), unlimited mailbox storage, French UI, FR support | https://www.infomaniak.com/en/ksuite |
| Google Workspace | From €7/mo (annual) | Ubiquitous, rich ecosystem, but US-hosted | https://workspace.google.com/ |
| Proton Business | From €6.99/mo | End-to-end encryption, Swiss-hosted, privacy-first | https://proton.me/business |
| OVH Email Pro | From ~€1.59/mo/alias | Cheapest French option, barebones | https://www.ovhcloud.com/fr/emails/ |

**Recommendation:** **Infomaniak kSuite Standard** once your domain (`cartheon.fr` or `cartheon.com`) is live. Two users = ~€9/month. Beats Google on privacy + price and is French-market-friendly.

Sources: [Valydex Proton vs Google](https://valydex.com/compare/google-workspace-vs-proton-mail-business), [EuroToolKit European alternatives](https://www.eurotoolkit.eu/blog/european-alternatives-google-workspace).

---

## 5. Analytics

### Traffic analytics

| Tool | Cost | GDPR-ready | Link |
|---|---|---|---|
| **Google Analytics 4** | Free | No (CNIL ruled non-compliant in 2022, requires consent banner + server-side proxy for compliance) | https://analytics.google.com/ |
| **Plausible** ★ recommended for CARTHEON | €9/mo (starter) | Yes, out of the box, no banner needed | https://plausible.io/ |
| Matomo Cloud | €29/mo | Yes | https://matomo.org/ |
| Simple Analytics | €9/mo | Yes | https://www.simpleanalytics.com/ |

**Recommendation:** **Plausible €9/mo**. CNIL/GDPR compliant by design, no cookie banner required for it, EU-hosted (Frankfurt). Saves you the compliance headache that GA4 triggers.

If budget is truly €0: install GA4 but document a properly-configured consent banner (see LEGAL_REQUIREMENTS.md). Realistically worth the €9 to avoid the CNIL exposure.

Source: [Plausible vs GA4](https://plausible.io/vs-google-analytics), [CNIL GA4 ruling context](https://eupick.com/blog/plausible-vs-google-analytics/).

### Heatmaps / session recordings

| Tool | Cost | Link |
|---|---|---|
| **Microsoft Clarity** ★ recommended | Free forever, unlimited | https://clarity.microsoft.com/ |
| Hotjar | Free 35 sessions/day, then €32/mo | https://www.hotjar.com/ |

**Recommendation:** Install **Clarity** from day 1. Free, unlimited, best-in-class session recordings. The lift in conversion-rate insight is massive for a solo-founder team.

---

## 6. Payment Processing

### Primary

**Stripe** — required.
- Cards: 1.5% + €0.25 for EU cards, 2.5% + €0.25 for non-EU
- Setup: 10 minutes, no monthly fee, IBAN payout 7 days after first charge
- Integrates with Shopify, WooCommerce, PrestaShop natively
- Link: https://stripe.com/fr

### Secondary

**PayPal** — essential for trust, some customers will only pay via PayPal.
- Commercial transactions: 2.9% + €0.35 for EU, up to 4.4% for non-EU
- Link: https://www.paypal.com/fr/business

### BNPL (buy-now-pay-later)

**Klarna** via Stripe — install once revenue is stable.
- 4.99% + €0.40 — expensive but lifts average order value 20–30% for under-30 customers
- Link: https://www.klarna.com/fr/

### Additional

**Apple Pay / Google Pay** — enable through Stripe, free. One-tap checkout lifts mobile conversion ~10%.

Source: [Paulette Factory Stripe vs PayPal vs WooPayments 2026](https://paulettefactory.fr/frais-woocommerce-2026-paypal-stripe-woopayments/).

---

## 7. Shipping

| Option | Cost | Best for | Link |
|---|---|---|---|
| **Sendcloud** ★ recommended | Free plan up to 100 shipments/mo | French ecom standard, multi-carrier dashboard | https://www.sendcloud.com/fr/ |
| La Poste Pro | Free account, volume discounts | If shipping only Colissimo | https://www.laposte.fr/professionnel |
| Mondial Relay Pro (directly) | From €2.49/parcel | Parcel-relay network | https://www.mondialrelay.fr/ |
| Chronopost Pro (directly) | From €3.23/parcel | Express (next day France) | https://www.chronopost.fr/ |

**Recommendation:** **Sendcloud free plan**. Pre-negotiated rates give:
- Mondial Relay from €2.49 (cheapest, 14,000+ pickup points France)
- Colissimo from €4.73 (home delivery)
- Chronopost from €3.23 (next-day)

One dashboard, one label printer, one return portal. At 100 parcels/month the free tier tops out — then upgrade to ~€45/mo plan.

Sources: [Sendcloud tarifs](https://www.sendcloud.com/fr/tarifs/), [Shippypro France courier guide](https://www.blog.shippypro.com/en/best-couriers-france).

### Offer Mondial Relay at checkout

Essential. French shoppers expect pickup-point delivery — Mondial Relay serves 85%+ of the French population and costs 30–50% less than home delivery.

---

## 8. Customer Support

### Live chat

| Tool | Free tier | Best for | Link |
|---|---|---|---|
| **Crisp** ★ recommended | Yes, 2 seats permanent | Unlimited conversations, chat + email + CRM | https://crisp.chat/ |
| Intercom | 1 user, 100 conversations/mo | Premium SaaS feel | https://www.intercom.com/ |
| Zendesk | 1 agent, $19/mo | Legacy enterprise | https://www.zendesk.com/ |
| Tidio | Free up to 50 conversations/mo | E-commerce + chatbot bundle | https://www.tidio.com/ |

**Recommendation:** CARTHEON already has a **custom chatbot** (`chatbot.js`). Keep it for FAQ. Add **Crisp** only if human-staffed chat becomes necessary post-launch. If you grow past 100 tickets/month, upgrade to Crisp Pro (~€25/mo).

Source: [Crisp vs Intercom 2026](https://www.featurebase.app/blog/crisp-vs-intercom).

### Help center

**Notion public page** — free, owns the URL, easy to update. Example: `help.cartheon.fr` → public Notion doc. Upgrade to a proper help center (Crisp Helpdesk, Intercom Articles) at 500+ orders/month.

---

## 9. Social Media

### Scheduling

| Tool | Free tier | Best for | Link |
|---|---|---|---|
| **Metricool** ★ recommended | Free 20 posts/mo, includes analytics | Best free option, covers IG + TikTok + FB | https://metricool.com/ |
| Buffer | 3 channels, 10 posts/channel free | Simplest UI | https://buffer.com/ |
| Later | Trial only, $18.75/mo paid | Instagram-first, visual grid planner | https://later.com/ |

**Recommendation:** Metricool free. Covers Instagram, TikTok, Facebook, Pinterest. Analytics bundled. Paid tier (€22/mo) only if you need >20 posts/month.

Source: [Buffer scheduling tools](https://buffer.com/resources/social-media-scheduling-tools/).

### Analytics

Instagram Insights (native) is enough at launch. Add Iconosquare (€49/mo) only after 5k followers.

---

## 10. Photography & Content

| Tool | Cost | Use case | Link |
|---|---|---|---|
| **Canva Free** ★ | Free | Social graphics, product mockups | https://www.canva.com/ |
| Canva Pro | €12/mo | Background remover, brand kit, 1M+ photos | Same link |
| **Photoroom** ★ | Free for <3 photos/day | Instant product-photo background removal | https://www.photoroom.com/ |
| Unfold | Free (IAP) | Instagram Story templates | https://unfold.com/ |
| Mojo | Free (IAP) | Animated stories/reels | https://www.mojo.video/ |
| Lightroom Mobile | Free (presets in-app) | Product photo color grading | https://lightroom.adobe.com/ |

**Recommendation:** Canva Free + Photoroom Free covers 90% of CARTHEON's needs for launch. Upgrade Canva to Pro only after 100 orders — brand kit and background remover justify it then.

### Product photography kit (physical)

- Cheap ring light: ~€25 on Amazon FR
- White paper (Amazon A2 matte): ~€15
- iPhone 12+ (you have it): use 1x lens, RAW if possible
- Natural window light > artificial — shoot 10am–2pm on a bright day
- Consistency > expensive gear: same background, same angle, same lighting on every product

---

## 11. Productivity & Collaboration

| Tool | Free tier | Use | Link |
|---|---|---|---|
| **Notion** ★ recommended | Free 2-user plan (unlimited pages) | Team wiki, supplier contacts, product specs, FAQ drafts | https://www.notion.so/ |
| Google Drive | 15 GB free | Shared files, spreadsheets, product photos | https://drive.google.com/ |
| **Trello** ★ recommended | Free unlimited cards | Simple kanban for launch checklist, supplier orders | https://trello.com/ |
| Linear | Free up to 250 issues | Engineering-quality task tracking; overkill at this stage | https://linear.app/ |
| Slack | Free 90-day history | Team chat — only if you add a 3rd person, 2 founders can WhatsApp | https://slack.com/ |

**Recommendation:** Notion + Google Drive + Trello. Zero cost, covers all collaboration needs.

---

## Cost Ramp — What to pay for and when

| Stage | Trigger | Add this | Monthly cost |
|---|---|---|---:|
| **Launch** | Today | Infomaniak email (€4.59 × 2) + Plausible (€9) | **~€18** |
| **First 100 orders** | ~Month 2 | Shopify Basic (€36) or keep static + Stripe Checkout | **~€54** |
| **First €1k revenue** | ~Month 3 | Canva Pro (€12) | **~€66** |
| **First 500 orders** | ~Month 6 | Crisp Pro (€25) + Sendcloud Lite (€45) | **~€136** |
| **First €5k/mo rev** | ~Month 9 | Klaviyo (~€45) instead of Brevo | **~€181** |
| **First €10k/mo rev** | ~Month 12 | Meta ads retainer or agency | **~€500+** |

---

## What to skip for now

- **Accounting agency (expert-comptable)** — €80–200/mo, not needed under the micro-entreprise regime. Indy + URSSAF is enough until you cross €85k/year.
- **Inventory-management software** — Shopify handles stock at the scale you're starting.
- **Custom email domain immediately** — you can launch with a Gmail and upgrade within 30 days; nothing bad happens.
- **CRM (HubSpot/Pipedrive)** — Shopify customer page + Brevo is all you need.
- **Project management SaaS (Asana/Monday)** — Trello free is strictly sufficient.
- **SEO tools (Ahrefs/Semrush)** — €100+/mo, zero ROI until you're shipping 10+ blog posts/month. Free Google Search Console is fine.

---

**Last updated:** 16 April 2026
