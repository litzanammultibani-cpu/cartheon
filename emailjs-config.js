/* =========================================================
   EmailJS Configuration
   =========================================================
   To enable AUTOMATIC password recovery emails:

   1. Go to https://www.emailjs.com/ and create a free account
      (200 free emails per month — enough for testing & early use)

   2. Add an email service (Gmail, Outlook, SMTP, etc.)
      → copy the SERVICE ID (e.g. "service_abc1234")

   3. Create an email template:
      Subject: Your CARTHEON recovery code
      Body:
         Hi {{to_name}},
         Your recovery code is {{code}}.
         It expires in 15 minutes.
         — CARTHEON
      → copy the TEMPLATE ID (e.g. "template_xyz5678")

   4. From "Account" → "General", copy your PUBLIC KEY
      (e.g. "abcDEF1234_xyz")

   5. Fill in the three values below and refresh the page.

   Until these are filled in, recovery will still WORK but
   the code will be shown in a pop-up on screen instead of
   being emailed (development mode).
   ========================================================= */

window.EMAILJS_CONFIG = {
    PUBLIC_KEY:  '',   // paste public key here
    SERVICE_ID:  '',   // paste service ID here
    TEMPLATE_ID: '',   // paste template ID here
};

// Auto-init if configured
if (window.EMAILJS_CONFIG.PUBLIC_KEY && window.emailjs) {
    emailjs.init({ publicKey: window.EMAILJS_CONFIG.PUBLIC_KEY });
}
