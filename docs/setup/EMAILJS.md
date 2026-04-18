# Password Recovery Setup — EmailJS (5 minutes)

CARTHEON's password recovery sends a 6-digit verification code by email. The actual email sending uses **EmailJS** — a free service that lets static sites send real emails without a backend server. You set up an EmailJS account once, paste three values into `emailjs-config.js`, and recovery emails go out automatically.

> **Current status:** `emailjs-config.js` ships with **empty placeholders**. Until you fill in the 3 values below, recovery is in **development mode** — it still works, but the code is shown in a popup on screen instead of being emailed. Nothing breaks. This is fine for local testing and for friends-and-family previews.
>
> **Before you go public**, fill in the config. The admin login's "Forgot password" flow is the only user-facing feature that depends on it, so the cost of forgetting is low — but a real customer who hits "Forgot password" would see the code on screen, which looks amateur.

---

## Free tier limits

- **200 emails per month** — more than enough for testing & early launch
- Upgrade only if you grow past that

---

## Step-by-step

### 1. Create a free EmailJS account

Go to **https://www.emailjs.com/** → click "Sign Up Free" → verify your email.

### 2. Add an email service

- Dashboard → **Email Services** → **Add New Service**
- Pick Gmail / Outlook / any SMTP provider you own
- Follow the prompts to connect it
- Copy the **Service ID** (looks like `service_abc1234`)

### 3. Create an email template

- Dashboard → **Email Templates** → **Create New Template**
- **Subject:**
  ```
  Your CARTHEON recovery code
  ```
- **To Email:**
  ```
  {{to_email}}
  ```
- **Content (HTML or text):**
  ```
  Hi {{to_name}},

  Your CARTHEON recovery code is:

       {{code}}

  It expires in 15 minutes. If you didn't request this, ignore this email.

  — CARTHEON
  ```
- Save → copy the **Template ID** (looks like `template_xyz5678`)

### 4. Copy your public key

- Account → **General** → copy the **Public Key** (looks like `abcDEF1234_xyz`)

### 5. Paste the three values into `emailjs-config.js`

Open `C:\Users\litza\lume-store\emailjs-config.js` (at the project root) and fill in:

```js
window.EMAILJS_CONFIG = {
    PUBLIC_KEY:  'abcDEF1234_xyz',        // your public key
    SERVICE_ID:  'service_abc1234',        // your service ID
    TEMPLATE_ID: 'template_xyz5678',       // your template ID
};
```

### 6. Test it

1. Open `http://localhost:8080/admin.html`
2. On the login screen, click **"Forgot your password?"**
3. Enter your recovery email
4. Check your inbox — the 6-digit code should arrive within seconds
5. Enter it to reset your password

Done. You now have fully automatic, no-intervention password recovery.

---

## How recovery works under the hood

```
User clicks "Forgot password?"
  → enters email
  → system checks against stored recovery email
  → generates 6-digit code (cryptographically random)
  → hashes it with PBKDF2 + salt
  → stores hash + expiry (15 min) in localStorage
  → sends plaintext code to user via EmailJS
User receives email, enters code + new password
  → system verifies code (constant-time compare)
  → hashes new password with PBKDF2 (200,000 iterations)
  → stores new hash, clears recovery
Done — user logs in with new password.
```

**Security notes:**

- Code is hashed in storage — even reading localStorage doesn't reveal it
- Code expires after 15 minutes
- Max 5 verify attempts before the code is invalidated
- Same constant-time comparison prevents timing attacks
- Generic "if an account exists" response prevents user enumeration
- Lockout counter resets on successful password reset

---

## Limitations (be honest)

Because this is a frontend-only app:

1. **Recovery only works on the same device/browser** where the admin account was created. localStorage doesn't sync across devices.
2. **Rate limiting is client-side** — an attacker with full access to the device can bypass it. For public-internet production, move auth to a server.
3. **EmailJS public key is visible in the page source** — anyone can see it. That's how EmailJS works; your SMTP password stays on their server. Just be aware your monthly quota could be abused if someone scripts against it. EmailJS has anti-abuse protections.

When you graduate CARTHEON to a real backend (Shopify, custom server, or Supabase), you replace all of this with server-side auth. For now, this is as strong as client-side recovery gets.

---

**Last updated:** 16 April 2026.
