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
        <div class="account-tabs" role="tablist">
            <button class="tab-btn active" data-tab="signin" role="tab" aria-selected="true">SIGN IN</button>
            <button class="tab-btn" data-tab="register" role="tab" aria-selected="false">REGISTER</button>
        </div>
        <form class="account-form" id="signin-form" data-form="signin">
            <h2 id="account-title">Welcome back</h2>
            <p class="form-sub">Sign in to your CARTHEON account.</p>
            <label>Email<input type="email" required placeholder="you@example.com" autocomplete="email"></label>
            <label>Password<input type="password" required placeholder="••••••••" autocomplete="current-password"></label>
            <button type="submit" class="form-submit">SIGN IN</button>
            <p class="form-footer auth-err" id="auth-err-signin"></p>
        </form>
        <form class="account-form hidden" id="register-form" data-form="register">
            <h2>Create an account</h2>
            <p class="form-sub">Join the CARTHEON circle.</p>
            <label>First name<input type="text" required placeholder="Alexandru" autocomplete="given-name"></label>
            <label>Email<input type="email" required placeholder="you@example.com" autocomplete="email"></label>
            <label>Password<input type="password" required minlength="6" placeholder="at least 6 characters" autocomplete="new-password"></label>
            <button type="submit" class="form-submit">CREATE ACCOUNT</button>
            <p class="form-footer auth-err" id="auth-err-register"></p>
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
        $$('.tab-btn').forEach(b => {
            const active = b.dataset.tab === which;
            b.classList.toggle('active', active);
            b.setAttribute('aria-selected', String(active));
        });
        const signin   = $('#signin-form');
        const register = $('#register-form');
        const success  = $('#form-success');
        if (signin) signin.classList.toggle('hidden', which !== 'signin');
        if (register) register.classList.toggle('hidden', which !== 'register');
        if (success) success.classList.add('hidden');
        // Clear any error messages
        $$('.auth-err').forEach(e => { e.textContent = ''; });
    }

    function showSignedIn(user) {
        const signin   = $('#signin-form');
        const register = $('#register-form');
        const success  = $('#form-success');
        if (signin) signin.classList.add('hidden');
        if (register) register.classList.add('hidden');
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

    async function handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const [nameEl, emailEl, passEl] = form.querySelectorAll('input');
        const name = (nameEl.value || '').trim();
        const email = (emailEl.value || '').trim().toLowerCase();
        const pass = passEl.value;
        if (!name || !email || !pass) return;
        if (pass.length < 6) return showError('register', 'Password must be at least 6 characters.');
        let users = [];
        try { users = JSON.parse(localStorage.getItem(STORAGE_USERS)) || []; } catch (err) {}
        if (users.some(u => (u.email || '').toLowerCase() === email)) {
            return showError('register', 'An account with that email already exists. Sign in instead.');
        }
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
        const hash = await sha256Hex(pass + saltHex);
        users.push({
            name: name,
            email: email,
            salt: saltHex,
            hash: hash,
            createdAt: Date.now()
        });
        localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
        const session = { name: name, email: email };
        saveStoredUser(session);
        updateAccountBadges();
        showSignedIn(session);
    }

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

        // Tab switches
        $$('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => showTab(btn.dataset.tab));
        });

        // Forms — capture phase so we win over any existing plain-text handler
        const signin = $('#signin-form');
        const register = $('#register-form');
        if (signin) signin.addEventListener('submit', handleSignIn, true);
        if (register) register.addEventListener('submit', handleRegister, true);
    }

    function wireNavTriggers() {
        const triggers = $$('#nav-account, a[aria-label="Account"]');
        triggers.forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                openModal();
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
