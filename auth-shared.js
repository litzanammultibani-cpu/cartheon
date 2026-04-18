/* ============================================================
   CARTHEON — Customer auth (shared)
   Injects the login/register modal on any page that doesn't have
   one, and wires all ACCOUNT nav links to open it. Uses the same
   modal markup as index.html so scripts on index are untouched.

   Pages that DO have the modal (index.html): we only wire ACCOUNT
   triggers that point to index.html so they open the modal instead
   of navigating.
   ============================================================ */
(function () {
    'use strict';
    if (window.__cartheonAuthSharedLoaded) return;
    window.__cartheonAuthSharedLoaded = true;

    const STORAGE_USER  = 'cartheon_user';
    const STORAGE_USERS = 'cartheon_users';

    function $(sel, ctx) { return (ctx || document).querySelector(sel); }
    function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
            ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]
        );
    }

    function getStoredUser() {
        try { return JSON.parse(localStorage.getItem(STORAGE_USER)); }
        catch (e) { return null; }
    }

    function saveStoredUser(u) {
        localStorage.setItem(STORAGE_USER, JSON.stringify(u));
    }

    async function sha256Hex(str) {
        const buf = new TextEncoder().encode(str);
        const hash = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function modalHTML() {
        return `
<div class="modal-overlay" id="account-overlay" aria-hidden="true">
    <div class="modal" role="dialog" aria-labelledby="account-title" aria-modal="true">
        <button class="modal-close" id="account-close" aria-label="Close account modal">&times;</button>
        <form class="account-form" id="signin-form" data-form="signin">
            <h2 id="account-title">Welcome back</h2>
            <p class="form-sub">Sign in to your CARTHEON account.</p>
            <label>Email<input type="email" required placeholder="you@example.com" autocomplete="email"></label>
            <label>Password<input type="password" required placeholder="••••••••" autocomplete="current-password"></label>
            <button type="submit" class="form-submit">SIGN IN</button>
            <p class="form-footer auth-err" id="auth-err-signin"></p>
            <p class="form-footer" style="margin-top:16px;font-size:0.78rem;color:#888;">Accounts at CARTHEON are invitation-only. Contact <a href="mailto:hello@cartheon.store">hello@cartheon.store</a> for access.</p>
        </form>
        <div class="form-success hidden" id="form-success" role="status" aria-live="polite">
            <h2>Welcome, <span id="user-name">friend</span>.</h2>
            <p>You're signed in.</p>
            <button type="button" class="form-submit" id="success-close">CONTINUE</button>
        </div>
    </div>
</div>`;
    }

    function injectModal() {
        if (document.getElementById('account-overlay')) return false; // already present
        const wrap = document.createElement('div');
        wrap.innerHTML = modalHTML().trim();
        document.body.appendChild(wrap.firstChild);
        return true;
    }

    function updateAccountBadges() {
        const user = getStoredUser();
        $$('#nav-account, a[aria-label="Account"]').forEach(a => {
            a.textContent = user && user.name ? ('HI, ' + String(user.name).toUpperCase()) : 'ACCOUNT';
        });
    }

    function openModal() {
        const overlay = $('#account-overlay');
        if (!overlay) return;
        const user = getStoredUser();
        // If already signed in → show success view with sign-out
        if (user) {
            showSignedIn(user);
        } else {
            showTab('signin');
        }
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
    }

    function closeModal() {
        const overlay = $('#account-overlay');
        if (!overlay) return;
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
    }

    function showTab(which) {
        // Only 'signin' is supported publicly — register is admin-only.
        const signin  = $('#signin-form');
        const success = $('#form-success');
        if (signin) signin.classList.remove('hidden');
        if (success) success.classList.add('hidden');
        $$('.auth-err').forEach(e => { e.textContent = ''; });
    }

    function showSignedIn(user) {
        const signin  = $('#signin-form');
        const success = $('#form-success');
        if (signin) signin.classList.add('hidden');
        if (success) {
            success.classList.remove('hidden');
            const nameSpan = $('#user-name');
            if (nameSpan) nameSpan.textContent = user.name || 'friend';
            // Replace close button with a sign-out option
            const btn = $('#success-close');
            if (btn) {
                btn.textContent = 'SIGN OUT';
                btn.onclick = () => {
                    localStorage.removeItem(STORAGE_USER);
                    updateAccountBadges();
                    showTab('signin');
                };
            }
        }
    }

    function showError(formKey, msg) {
        const el = $('#auth-err-' + formKey);
        if (el) el.textContent = msg;
    }

    async function handleSignIn(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('input[type="email"]').value.trim().toLowerCase();
        const pass = form.querySelector('input[type="password"]').value;
        if (!email || !pass) return;
        let users = [];
        try { users = JSON.parse(localStorage.getItem(STORAGE_USERS)) || []; } catch (err) {}
        const user = users.find(u => (u.email || '').toLowerCase() === email);
        if (!user) return showError('signin', 'No account with that email. Register instead?');
        const hash = await sha256Hex(pass + (user.salt || ''));
        if (hash !== user.hash) return showError('signin', 'Wrong password.');
        const session = { name: user.name, email: user.email };
        saveStoredUser(session);
        updateAccountBadges();
        showSignedIn(session);
    }

    // Registration is admin-only now (done from the admin Customers view).

    function wireModal() {
        // Don't double-wire on pages where script.js already handles things — but
        // since our sign-in uses hashed passwords and theirs uses plain, we
        // override by binding with capture so our handler runs first.
        const overlay = $('#account-overlay');
        if (!overlay) return;

        // Close
        const closeBtn = $('#account-close');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

        // Forms — capture phase so we win over any existing plain-text handler
        const signin = $('#signin-form');
        if (signin) signin.addEventListener('submit', handleSignIn, true);
    }

    function wireNavTriggers() {
        const triggers = $$('#nav-account, a[aria-label="Account"]');
        triggers.forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                // Prefer the dedicated page. Pass ?return= so we come back here after signing in.
                const here = location.pathname.split('/').pop() || 'index.html';
                const onAccountPage = /account\.html$/i.test(here);
                if (onAccountPage) return; // already there
                const ret = /^[a-z0-9_-]+\.html$/i.test(here) ? here : 'index.html';
                location.href = 'account.html?return=' + encodeURIComponent(ret);
            });
        });
    }

    function init() {
        injectModal();
        wireModal();
        wireNavTriggers();
        updateAccountBadges();

        // Deep-link: ?signin=1 or #account auto-opens the modal
        const url = new URL(window.location.href);
        if (url.searchParams.get('signin') === '1' || window.location.hash === '#account') {
            setTimeout(openModal, 100);
        }

        // Expose API
        window.CartheonAuth = {
            open: openModal,
            close: closeModal,
            getUser: getStoredUser,
            signOut: () => { localStorage.removeItem(STORAGE_USER); updateAccountBadges(); }
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
