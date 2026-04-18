/* =========================================================
   CARTHEON — Admin Panel
   Security:
     - PBKDF2-SHA256 (200,000 iterations) password hashing
     - 16-byte random salt per credential
     - Session token (random 32 bytes), 60-min expiry, idle-reset
     - Failed-login rate limiting (5 attempts → 15 min lockout)
     - Session cleared on tab close (sessionStorage)
     - No plaintext credentials in code or localStorage

   Note: This is CLIENT-SIDE security. Because the browser runs
   all code locally, a determined attacker with full access to the
   user's device could still bypass it. For real production, move
   auth to a server. But for local/offline use this is as strong
   as it gets.
   ========================================================= */

const LS = {
    AUTH:         'cartheon_admin_auth_v1',   // { username, email, salt, hash, iterations, createdAt }
    LOCKOUT:      'cartheon_admin_lockout',   // { count, until }
    RECOVERY:     'cartheon_admin_recovery',  // { codeHash, salt, expires, attempts }
    ORDERS:       'cartheon_orders',
    USERS:        'cartheon_users',           // customer list
    PRODUCTS:     'cartheon_products',
    PENDING:      'cartheon_admin_pending_actions', // dual-control / 4-eyes queue
};

/* ---------- Dual-control (4-eyes) constants ---------- */
const PENDING_EXPIRY_MS       = 7 * 24 * 60 * 60 * 1000;   // 7 days
const PENDING_KEEP_AFTER_MS   = 24 * 60 * 60 * 1000;       // 24h retention for expired/rejected rows
const PENDING_ADMIN_ACTIONS = new Set([
    'create_admin',
    'promote_to_admin',
    'demote_admin',
    'delete_admin'
]);

const SS = {
    SESSION:      'cartheon_admin_session',   // { token, user, expires }
};

const PBKDF2_ITERATIONS = 200000;
const SESSION_DURATION_MS = 60 * 60 * 1000;          // 1 hour
const IDLE_TIMEOUT_MS     = 30 * 60 * 1000;          // 30 min idle
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;          // 15 min

/* ---------- Crypto helpers (Web Crypto API) ---------- */
const textEnc = new TextEncoder();

function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i*2, 2), 16);
    return bytes;
}
function randomBytes(n) {
    const arr = new Uint8Array(n);
    crypto.getRandomValues(arr);
    return arr;
}

async function pbkdf2Hash(password, saltBytes, iterations = PBKDF2_ITERATIONS) {
    const keyMat = await crypto.subtle.importKey(
        'raw',
        textEnc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
        keyMat,
        256
    );
    return bytesToHex(new Uint8Array(bits));
}

// Constant-time string compare — prevents timing attacks
function constantTimeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

/* ---------- Storage helpers ---------- */
function lsGet(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}
function lsSet(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function ssGet(key, fallback = null) {
    try { return JSON.parse(sessionStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}
function ssSet(key, value) { sessionStorage.setItem(key, JSON.stringify(value)); }
function ssDel(key) { sessionStorage.removeItem(key); }

/* =========================================================
   TEAM / USERS — multi-admin support
   Data model: LS.AUTH = { version: 2, users: [ { id, username, email,
   salt, hash, iterations, role, createdAt, createdBy, updatedAt } ] }
   Old single-user format is auto-migrated on first read.
   ========================================================= */

const ROLES = {
    admin: {
        label: 'Admin',
        description: 'Full access — manage team, products, orders, customers, settings, and dangerous actions.',
        permissions: ['team:manage', 'products:edit', 'orders:edit', 'orders:delete', 'orders:update-status', 'customers:edit', 'customers:delete', 'settings:dangerous', 'export-data']
    },
    manager: {
        label: 'Manager',
        description: 'Operational lead — manage products, orders and customers. Cannot manage team or run dangerous actions.',
        permissions: ['products:edit', 'orders:edit', 'orders:delete', 'orders:update-status', 'customers:edit', 'customers:delete']
    },
    'store-manager': {
        label: 'Store Manager',
        description: 'Handles day-to-day store operations — orders, shipping, customer support. Cannot edit the product catalog or manage team.',
        permissions: ['orders:edit', 'orders:update-status', 'customers:edit']
    },
    employee: {
        label: 'Employee',
        description: 'Fulfillment staff — view orders and update status/tracking. Cannot edit products, customers or team.',
        permissions: ['orders:update-status']
    }
};

const VALID_ROLES = Object.keys(ROLES);

function hasPermission(role, perm) {
    return (ROLES[role] || ROLES.admin).permissions.includes(perm);
}

function genUserId() { return 'u_' + bytesToHex(randomBytes(8)); }

function getUsers() {
    const data = lsGet(LS.AUTH);
    if (!data) return [];
    if (Array.isArray(data.users)) return data.users;
    // Migrate old single-user object
    if (data.username && data.hash) {
        const migrated = [{
            id: genUserId(),
            username: data.username,
            email: data.email || '',
            salt: data.salt,
            hash: data.hash,
            iterations: data.iterations || PBKDF2_ITERATIONS,
            role: 'admin',
            createdAt: data.createdAt || Date.now(),
            createdBy: 'initial-setup',
            updatedAt: data.updatedAt || Date.now()
        }];
        lsSet(LS.AUTH, { version: 2, users: migrated });
        return migrated;
    }
    return [];
}

function saveUsers(users) { lsSet(LS.AUTH, { version: 2, users }); }

function findUserByUsername(username) {
    if (!username) return null;
    return getUsers().find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

function findUserById(id) {
    return getUsers().find(u => u.id === id) || null;
}

function usernameIsTaken(username, ignoreId = null) {
    const target = username.toLowerCase();
    return getUsers().some(u => u.id !== ignoreId && u.username.toLowerCase() === target);
}

/* ---------- Auth: setup / login / session ---------- */
async function createAdmin(username, password, email, role = 'admin', createdBy = 'initial-setup') {
    if (usernameIsTaken(username)) throw new Error('A user with that username already exists.');
    const salt = randomBytes(16);
    const hash = await pbkdf2Hash(password, salt, PBKDF2_ITERATIONS);
    const finalRole = VALID_ROLES.includes(role) ? role : 'admin';
    const user = {
        id: genUserId(),
        username,
        email: (email || '').toLowerCase(),
        salt: bytesToHex(salt),
        hash,
        iterations: PBKDF2_ITERATIONS,
        role: finalRole,
        createdAt: Date.now(),
        createdBy,
        updatedAt: Date.now()
    };
    const users = getUsers();
    users.push(user);
    saveUsers(users);
    return user;
}

async function updateUserPassword(userId, newPassword) {
    const users = getUsers();
    const u = users.find(x => x.id === userId);
    if (!u) throw new Error('User not found.');
    const salt = randomBytes(16);
    u.salt = bytesToHex(salt);
    u.hash = await pbkdf2Hash(newPassword, salt, PBKDF2_ITERATIONS);
    u.iterations = PBKDF2_ITERATIONS;
    u.updatedAt = Date.now();
    saveUsers(users);
}

function updateUser(userId, changes) {
    const users = getUsers();
    const idx = users.findIndex(x => x.id === userId);
    if (idx < 0) throw new Error('User not found.');
    if (changes.username && usernameIsTaken(changes.username, userId)) {
        throw new Error('That username is already taken.');
    }
    if (changes.role && !VALID_ROLES.includes(changes.role)) {
        throw new Error('Invalid role.');
    }
    const allowed = ['username', 'email', 'role'];
    for (const k of allowed) {
        if (changes[k] !== undefined) users[idx][k] = k === 'email' ? (changes[k] || '').toLowerCase() : changes[k];
    }
    users[idx].updatedAt = Date.now();
    saveUsers(users);
}

function deleteUser(userId) {
    const users = getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) throw new Error('User not found.');
    // Can't delete the last admin
    const otherAdmins = users.filter(u => u.role === 'admin' && u.id !== userId);
    if (target.role === 'admin' && otherAdmins.length === 0) {
        throw new Error('Cannot delete the last admin — promote someone else first.');
    }
    saveUsers(users.filter(u => u.id !== userId));
}

/* =========================================================
   DUAL-CONTROL / 4-EYES — pending admin-tier actions
   ========================================================= */
function genPendingId() { return 'pa_' + bytesToHex(randomBytes(12)); }

function countAdmins() {
    return getUsers().filter(u => u.role === 'admin').length;
}

// Bootstrap exception: only 1 admin → they can create 1 new admin directly
function adminActionsRequireApproval() {
    return countAdmins() >= 2;
}

function getPendingActions() {
    const raw = lsGet(LS.PENDING, []);
    if (!Array.isArray(raw)) return [];
    return raw;
}

function savePendingActions(list) { lsSet(LS.PENDING, list); }

// Remove any pending actions for users that no longer exist (cleanup on delete)
function purgePendingForUser(userId) {
    const cleaned = getPendingActions().filter(pa => pa.targetUserId !== userId);
    savePendingActions(cleaned);
}

// Sweep: mark expired, drop rejected/expired older than retention window
function sweepPendingActions() {
    const now = Date.now();
    const list = getPendingActions();
    let changed = false;
    const kept = [];
    for (const pa of list) {
        if (pa.status === 'pending' && pa.expiresAt && now > pa.expiresAt) {
            pa.status = 'expired';
            changed = true;
        }
        // Drop resolved rows older than retention window (except we want user to see rejected ones briefly)
        const resolvedTs = pa.resolvedAt || pa.expiresAt || 0;
        if ((pa.status === 'expired' || pa.status === 'rejected' || pa.status === 'approved')
             && resolvedTs && (now - resolvedTs) > PENDING_KEEP_AFTER_MS) {
            changed = true;
            continue;
        }
        kept.push(pa);
    }
    if (changed || kept.length !== list.length) savePendingActions(kept);
    return kept;
}

function hasPendingForTarget(userId) {
    return sweepPendingActions().some(pa => pa.status === 'pending' && pa.targetUserId === userId);
}

function hasPendingCreateAdminForUsername(username) {
    const lower = (username || '').toLowerCase();
    return sweepPendingActions().some(pa =>
        pa.status === 'pending'
        && pa.type === 'create_admin'
        && (pa.target?.username || '').toLowerCase() === lower
    );
}

function createPendingAction(partial) {
    const list = getPendingActions();
    const now = Date.now();
    const pa = {
        id: genPendingId(),
        requestedAt: now,
        expiresAt: now + PENDING_EXPIRY_MS,
        approvedBy: [],
        rejectedBy: null,
        status: 'pending',
        note: partial.note || '',
        ...partial
    };
    list.push(pa);
    savePendingActions(list);
    return pa;
}

// Human-readable summary for a pending action
function describePendingAction(pa) {
    switch (pa.type) {
        case 'create_admin':
            return `Add new admin: ${pa.target?.username || '?'}`;
        case 'promote_to_admin': {
            const u = findUserById(pa.targetUserId);
            return `Promote ${u?.username || '(deleted user)'} to Admin`;
        }
        case 'demote_admin': {
            const u = findUserById(pa.targetUserId);
            const label = (ROLES[pa.newRole] || ROLES.admin).label;
            return `Demote admin '${u?.username || '(deleted user)'}' to ${label}`;
        }
        case 'delete_admin': {
            const u = findUserById(pa.targetUserId);
            return `Delete admin '${u?.username || '(deleted user)'}'`;
        }
        default:
            return 'Unknown action';
    }
}

// Execute an approved pending action. Returns { ok, reason }.
async function executePendingAction(pa) {
    try {
        if (pa.type === 'create_admin') {
            const t = pa.target || {};
            if (!t.username || !t.hash || !t.salt) {
                return { ok: false, reason: 'Missing target credentials.' };
            }
            if (usernameIsTaken(t.username)) {
                return { ok: false, reason: 'Username is now taken — request cannot be completed.' };
            }
            const users = getUsers();
            users.push({
                id: genUserId(),
                username: t.username,
                email: (t.email || '').toLowerCase(),
                salt: t.salt,
                hash: t.hash,
                iterations: t.iterations || PBKDF2_ITERATIONS,
                role: 'admin',
                createdAt: Date.now(),
                createdBy: pa.requestedBy?.userId || 'approval',
                updatedAt: Date.now()
            });
            saveUsers(users);
            return { ok: true };
        }
        if (pa.type === 'promote_to_admin') {
            const u = findUserById(pa.targetUserId);
            if (!u) return { ok: false, reason: 'Target user no longer exists.' };
            updateUser(pa.targetUserId, { role: 'admin' });
            return { ok: true };
        }
        if (pa.type === 'demote_admin') {
            const u = findUserById(pa.targetUserId);
            if (!u) return { ok: false, reason: 'Target user no longer exists.' };
            // Don't let approval remove the last admin
            const otherAdmins = getUsers().filter(x => x.role === 'admin' && x.id !== pa.targetUserId);
            if (u.role === 'admin' && otherAdmins.length === 0) {
                return { ok: false, reason: 'Cannot demote the last admin.' };
            }
            updateUser(pa.targetUserId, { role: pa.newRole || 'manager' });
            return { ok: true };
        }
        if (pa.type === 'delete_admin') {
            const u = findUserById(pa.targetUserId);
            if (!u) return { ok: false, reason: 'Target user no longer exists.' };
            deleteUser(pa.targetUserId);
            purgePendingForUser(pa.targetUserId);
            return { ok: true };
        }
        return { ok: false, reason: 'Unknown action type.' };
    } catch (err) {
        return { ok: false, reason: err.message || 'Execution failed.' };
    }
}

async function verifyLogin(username, password) {
    const users = getUsers();
    if (users.length === 0) return { ok: false, reason: 'no-account' };

    // Lockout check
    const lockout = lsGet(LS.LOCKOUT, { count: 0, until: 0 });
    if (lockout.until && Date.now() < lockout.until) {
        const mins = Math.ceil((lockout.until - Date.now()) / 60000);
        return { ok: false, reason: `Too many failed attempts. Try again in ${mins} min.` };
    }

    const user = findUserByUsername(username);

    // Always compute PBKDF2 even if user missing — prevents timing side-channel
    const fakeSalt = hexToBytes('0'.repeat(32));
    const salt = user ? hexToBytes(user.salt) : fakeSalt;
    const iterations = user ? (user.iterations || PBKDF2_ITERATIONS) : PBKDF2_ITERATIONS;
    const candidate = await pbkdf2Hash(password, salt, iterations);
    const ok = !!user && constantTimeEqual(candidate, user.hash);

    if (!ok) {
        const newCount = (lockout.count || 0) + 1;
        if (newCount >= MAX_FAILED_ATTEMPTS) {
            lsSet(LS.LOCKOUT, { count: newCount, until: Date.now() + LOCKOUT_DURATION_MS });
            return { ok: false, reason: `Locked out for 15 min after ${newCount} failed attempts.` };
        }
        lsSet(LS.LOCKOUT, { count: newCount, until: 0 });
        return { ok: false, reason: `Invalid credentials. ${MAX_FAILED_ATTEMPTS - newCount} attempts left.` };
    }

    // Success — clear failed counter, create session with role + userId
    lsSet(LS.LOCKOUT, { count: 0, until: 0 });
    const token = bytesToHex(randomBytes(32));
    const expires = Date.now() + SESSION_DURATION_MS;
    ssSet(SS.SESSION, {
        token,
        userId: user.id,
        user: user.username,
        role: user.role || 'admin',
        expires,
        lastActivity: Date.now()
    });
    return { ok: true };
}

function getActiveSession() {
    const s = ssGet(SS.SESSION);
    if (!s) return null;
    if (Date.now() > s.expires) { ssDel(SS.SESSION); return null; }
    if (Date.now() - (s.lastActivity || 0) > IDLE_TIMEOUT_MS) { ssDel(SS.SESSION); return null; }
    return s;
}

function touchSession() {
    const s = ssGet(SS.SESSION);
    if (s) { s.lastActivity = Date.now(); ssSet(SS.SESSION, s); }
}

function logout() {
    ssDel(SS.SESSION);
    location.reload();
}

/* ---------- Default products ---------- */
const DEFAULT_PRODUCTS = [
    { id: 'celeste-chain',   name: 'Céleste Chain Bracelet',  price: 34.00, category: 'Sterling Silver',    badge: 'NEW',         symbol: '⌒', image: '' },
    { id: 'infiniti-cuff',   name: 'Infiniti Cuff',            price: 42.00, category: '925 Silver',          badge: '',            symbol: '∞', image: '' },
    { id: 'aurora-bangle',   name: 'Aurora Bangle',            price: 28.00, category: 'Polished Silver',     badge: 'BESTSELLER',  symbol: '○', image: '' },
    { id: 'etoile-charm',    name: 'Étoile Charm Bracelet',    price: 38.00, category: 'Sterling Silver',    badge: '',            symbol: '✦', image: '' },
    { id: 'lune-tennis',     name: 'Lune Tennis Bracelet',     price: 52.00, category: '925 Silver · Zirconia', badge: '',         symbol: '◐', image: '' },
    { id: 'mira-paperclip',  name: 'Mira Paperclip Chain',     price: 36.00, category: 'Sterling Silver',    badge: 'NEW',         symbol: '◇', image: '' },
    { id: 'solis-beaded',    name: 'Sólis Beaded Bracelet',    price: 26.00, category: 'Silver Beads',        badge: '',            symbol: '◉', image: '' },
    { id: 'sienna-heart',    name: 'Sienna Heart Bracelet',    price: 32.00, category: 'Polished Silver',     badge: '',            symbol: '❉', image: '' },
];

function getProducts() {
    const custom = lsGet(LS.PRODUCTS);
    if (custom && Array.isArray(custom)) return custom;
    return DEFAULT_PRODUCTS.slice();
}
function saveProducts(list) { lsSet(LS.PRODUCTS, list); }

/* ---------- DOM shortcuts ---------- */
const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

/* =========================================================
   BOOT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const users = getUsers();  // also triggers migration if needed
    if (users.length === 0) {
        showSetup();
    } else if (getActiveSession()) {
        showAdmin();
    } else {
        showLogin();
    }
});

function hideAllScreens() {
    ['setup-screen', 'login-screen', 'recovery-request-screen', 'recovery-verify-screen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    $('#admin-shell').classList.add('hidden');
}

function showSetup() {
    hideAllScreens();
    $('#setup-screen').classList.remove('hidden');

    $('#setup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const u  = $('#setup-user').value.trim();
        const em = $('#setup-email').value.trim();
        const p1 = $('#setup-pass').value;
        const p2 = $('#setup-pass2').value;
        const err = $('#setup-error');
        err.textContent = '';

        if (!u || u.length < 3) return err.textContent = 'Username must be at least 3 characters.';
        if (!em || !/.+@.+\..+/.test(em)) return err.textContent = 'Please provide a valid recovery email.';
        if (p1.length < 8) return err.textContent = 'Password must be at least 8 characters.';
        if (!/[A-Za-z]/.test(p1) || !/[0-9]/.test(p1)) return err.textContent = 'Password needs at least one letter and one number.';
        if (p1 !== p2) return err.textContent = 'Passwords do not match.';

        $('#setup-form button[type=submit]').textContent = 'CREATING…';
        await createAdmin(u, p1, em);

        // Auto-login after setup
        const r = await verifyLogin(u, p1);
        if (r.ok) location.reload();
    });
}

function showLogin() {
    hideAllScreens();
    $('#login-screen').classList.remove('hidden');

    const form = $('#login-form');
    const err  = $('#login-error');
    const btn  = $('#login-submit');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        err.textContent = '';
        const u = $('#login-user').value.trim();
        const p = $('#login-pass').value;

        btn.textContent = 'CHECKING…';
        btn.disabled = true;
        const r = await verifyLogin(u, p);
        btn.disabled = false;
        btn.textContent = 'SIGN IN';

        if (r.ok) location.reload();
        else err.textContent = r.reason || 'Login failed.';
    });

    $('#forgot-link').addEventListener('click', (e) => {
        e.preventDefault();
        showRecoveryRequest();
    });
}

/* =========================================================
   PASSWORD RECOVERY
   ========================================================= */
function showRecoveryRequest() {
    hideAllScreens();
    $('#recovery-request-screen').classList.remove('hidden');

    const form = $('#recovery-request-form');
    const err  = $('#recovery-error');
    const btn  = $('#recovery-send-btn');

    // Prevent double-binding
    const clone = form.cloneNode(true);
    form.parentNode.replaceChild(clone, form);

    document.getElementById('recovery-request-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        err.textContent = '';
        const email = document.getElementById('recovery-email').value.trim().toLowerCase();
        const users = getUsers();

        if (users.length === 0) {
            err.textContent = 'No account exists yet. Please create one first.';
            return;
        }

        // Find user with matching email (don't reveal match to attacker)
        const targetUser = users.find(u => (u.email || '').toLowerCase() === email);

        const sendBtn = document.getElementById('recovery-send-btn');
        sendBtn.disabled = true;
        sendBtn.textContent = 'SENDING…';

        if (targetUser) {
            const code = generateCode(6);
            await storeRecoveryCode(code, targetUser.id);
            const sent = await sendRecoveryEmail(targetUser.email, targetUser.username, code);
            if (!sent) {
                // Dev fallback: show code on screen
                alert(`📧 Email sending is not configured yet.\n\nYour recovery code (dev mode):\n\n   ${code}\n\nConfigure EmailJS in emailjs-config.js for automatic emails.\nSee RECOVERY_SETUP.md for the 5-minute setup.`);
            }
        }

        sendBtn.disabled = false;
        sendBtn.textContent = 'SEND CODE';

        // Always go to verify screen — attacker can't tell if email matched
        $('#recovery-sent-info').textContent = `If an account exists for ${email}, a code has been sent. It expires in 15 minutes.`;
        showRecoveryVerify();
    });

    document.getElementById('back-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
}

function showRecoveryVerify() {
    hideAllScreens();
    $('#recovery-verify-screen').classList.remove('hidden');

    const form = document.getElementById('recovery-verify-form');
    const clone = form.cloneNode(true);
    form.parentNode.replaceChild(clone, form);

    document.getElementById('recovery-verify-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = document.getElementById('recovery-verify-error');
        err.textContent = '';
        const code  = document.getElementById('recovery-code').value.trim();
        const p1    = document.getElementById('recovery-new-pass').value;
        const p2    = document.getElementById('recovery-new-pass2').value;

        if (!/^\d{6}$/.test(code)) { err.textContent = 'Enter the 6-digit code.'; return; }
        if (p1.length < 8) { err.textContent = 'Password must be at least 8 characters.'; return; }
        if (!/[A-Za-z]/.test(p1) || !/[0-9]/.test(p1)) { err.textContent = 'Password needs a letter and a number.'; return; }
        if (p1 !== p2) { err.textContent = 'Passwords do not match.'; return; }

        const valid = await verifyRecoveryCode(code);
        if (!valid.ok) { err.textContent = valid.reason; return; }

        const rec = lsGet(LS.RECOVERY);
        const user = findUserById(rec?.userId);
        if (!user) { err.textContent = 'Recovery target not found. Start over.'; return; }
        await updateUserPassword(user.id, p1);
        localStorage.removeItem(LS.RECOVERY);
        lsSet(LS.LOCKOUT, { count: 0, until: 0 });
        alert('Password reset successful. Please sign in with your new password.');
        location.reload();
    });

    document.getElementById('back-to-login-2').addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
}

function generateCode(length = 6) {
    const digits = randomBytes(length);
    return Array.from(digits).map(b => (b % 10).toString()).join('');
}

async function storeRecoveryCode(code, userId) {
    const salt = randomBytes(16);
    const hash = await pbkdf2Hash(code, salt, 50000);  // fewer iters OK for 6-digit short-lived code
    lsSet(LS.RECOVERY, {
        userId,
        salt: bytesToHex(salt),
        hash,
        expires: Date.now() + 15 * 60 * 1000,   // 15 minutes
        attempts: 0
    });
}

async function verifyRecoveryCode(code) {
    const rec = lsGet(LS.RECOVERY);
    if (!rec) return { ok: false, reason: 'No recovery in progress. Request a new code.' };
    if (Date.now() > rec.expires) {
        localStorage.removeItem(LS.RECOVERY);
        return { ok: false, reason: 'Code expired. Please request a new one.' };
    }
    if (rec.attempts >= 5) {
        localStorage.removeItem(LS.RECOVERY);
        return { ok: false, reason: 'Too many attempts. Request a new code.' };
    }

    const salt = hexToBytes(rec.salt);
    const candidate = await pbkdf2Hash(code, salt, 50000);
    const ok = constantTimeEqual(candidate, rec.hash);

    if (!ok) {
        rec.attempts = (rec.attempts || 0) + 1;
        lsSet(LS.RECOVERY, rec);
        return { ok: false, reason: `Invalid code. ${5 - rec.attempts} attempts left.` };
    }
    return { ok: true };
}

async function sendRecoveryEmail(email, username, code) {
    const cfg = window.EMAILJS_CONFIG || {};
    if (!cfg.PUBLIC_KEY || !cfg.SERVICE_ID || !cfg.TEMPLATE_ID || !window.emailjs) {
        return false;
    }
    try {
        await emailjs.send(cfg.SERVICE_ID, cfg.TEMPLATE_ID, {
            to_name:  username,
            to_email: email,
            code:     code,
            subject:  'Your CARTHEON recovery code'
        });
        return true;
    } catch (err) {
        console.error('EmailJS send failed:', err);
        return false;
    }
}

function showAdmin() {
    $('#setup-screen').classList.add('hidden');
    $('#login-screen').classList.add('hidden');
    $('#admin-shell').classList.remove('hidden');

    const session = getActiveSession();
    $('#admin-name').textContent = session.user;

    // Idle-timeout watcher
    ['click', 'keydown', 'mousemove', 'scroll'].forEach(evt =>
        document.addEventListener(evt, touchSession, { passive: true })
    );
    // Expiry watchdog
    setInterval(() => {
        if (!getActiveSession()) { alert('Session expired. Please sign in again.'); logout(); }
    }, 30000);

    // Nav
    $$('.sb-link').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            $$('.sb-link').forEach(b => b.classList.toggle('active', b === btn));
            $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === view));
            if (view === 'dashboard') renderDashboard();
            if (view === 'products')  renderProducts();
            if (view === 'orders')    renderOrders();
            if (view === 'customers') renderCustomers();
            if (view === 'team')      renderTeam();
        });
    });

    $('#logout-btn').addEventListener('click', logout);

    // Product modal
    $('#add-product-btn').addEventListener('click', () => openProductModal());
    $('#product-modal-close').addEventListener('click', closeProductModal);
    $('#product-cancel').addEventListener('click', closeProductModal);
    $('#product-form').addEventListener('submit', saveProductHandler);

    // Product image upload
    $('#p-image').addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
            // If > 500KB, downscale; otherwise embed as-is but warn above 500KB
            let dataUrl;
            if (file.size > 500 * 1024) {
                dataUrl = await downscaleImage(file, 800, 0.85);
            } else {
                dataUrl = await new Promise((res, rej) => {
                    const r = new FileReader();
                    r.onload  = ev => res(ev.target.result);
                    r.onerror = rej;
                    r.readAsDataURL(file);
                });
            }
            $('#p-image-data').value = dataUrl;
            $('#p-image-preview-img').src = dataUrl;
            $('#p-image-preview').classList.remove('hidden');

            // Still warn if the resulting data URL is huge (base64 is ~33% larger than bytes)
            if (dataUrl.length > 700 * 1024) {
                let warn = $('#p-image-preview .file-size-warning');
                if (!warn) {
                    warn = document.createElement('p');
                    warn.className = 'file-size-warning';
                    $('#p-image-preview').appendChild(warn);
                }
                warn.textContent = 'Note: this image is large and takes up significant localStorage space.';
            } else {
                const warn = $('#p-image-preview .file-size-warning');
                if (warn) warn.remove();
            }
        } catch (err) {
            alert('Could not read image: ' + (err?.message || err));
        }
    });
    $('#p-image-remove').addEventListener('click', () => {
        $('#p-image').value = '';
        $('#p-image-data').value = '';
        $('#p-image-preview-img').removeAttribute('src');
        $('#p-image-preview').classList.add('hidden');
        const warn = $('#p-image-preview .file-size-warning');
        if (warn) warn.remove();
    });

    // Order modal
    $('#order-modal-close').addEventListener('click', () => $('#order-modal').classList.add('hidden'));

    // Team modal
    $('#add-team-btn').addEventListener('click', () => {
        if (session.role !== 'admin') { alert('Only admins can add team members.'); return; }
        openTeamModal();
    });
    $('#team-modal-close').addEventListener('click', closeTeamModal);
    $('#team-cancel').addEventListener('click', closeTeamModal);
    $('#team-form').addEventListener('submit', saveTeamMemberHandler);
    $('#tm-role').addEventListener('change', updateRoleDescription);

    // Settings
    $('#credentials-form').addEventListener('submit', saveCredentialsHandler);
    $('#export-data-btn').addEventListener('click', exportData);
    $('#clear-orders-btn').addEventListener('click', () => {
        if (!confirm('Delete ALL orders? This cannot be undone.')) return;
        localStorage.removeItem(LS.ORDERS);
        renderDashboard(); renderOrders();
    });
    $('#clear-customers-btn').addEventListener('click', () => {
        if (!confirm('Delete ALL customer records?')) return;
        localStorage.removeItem(LS.USERS);
        localStorage.removeItem('cartheon_user');
        renderDashboard(); renderCustomers();
    });
    $('#reset-products-btn').addEventListener('click', () => {
        if (!confirm('Reset products to defaults? Any custom products will be lost.')) return;
        localStorage.removeItem(LS.PRODUCTS);
        renderDashboard(); renderProducts();
    });

    const currentUser = findUserById(session.userId);
    $('#new-username').value = session.user;
    $('#new-email').value = currentUser?.email || '';

    // Apply role-based gating — managers see less
    applyRoleGating(session.role);

    renderDashboard();
}

function applyRoleGating(role) {
    const can = (perm) => hasPermission(role, perm);

    // Sidebar links
    const show = (selector, visible) => {
        const el = document.querySelector(selector);
        if (el) el.style.display = visible ? '' : 'none';
    };

    // Sidebar nav visibility
    show('.sb-link[data-view="team"]',      can('team:manage'));
    show('.sb-link[data-view="products"]',  can('products:edit'));
    show('.sb-link[data-view="customers"]', can('customers:edit'));
    // Settings is available for everyone (they need to change their own password)

    // Products: add button
    show('#add-product-btn', can('products:edit'));

    // Settings: dangerous buttons
    const dangerBtns = ['clear-orders-btn', 'clear-customers-btn', 'reset-products-btn'];
    dangerBtns.forEach(id => show('#' + id, can('settings:dangerous')));
    show('#export-data-btn', can('export-data'));

    // Apply to dashboard stat cards that non-admins shouldn't see? Keep visible — it's fine.

    // If the user is currently viewing a restricted view, kick them back to dashboard
    const activeView = document.querySelector('.view.active')?.dataset.view;
    const restrictedForRole = {
        team:      'team:manage',
        products:  'products:edit',
        customers: 'customers:edit'
    };
    if (activeView && restrictedForRole[activeView] && !can(restrictedForRole[activeView])) {
        document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.dataset.view === 'dashboard'));
        document.querySelectorAll('.sb-link').forEach(b => b.classList.toggle('active', b.dataset.view === 'dashboard'));
    }

    // Role badge in sidebar
    const roleLabel = document.getElementById('admin-role-badge');
    if (roleLabel) {
        roleLabel.textContent = (ROLES[role] || ROLES.admin).label;
        roleLabel.className = `role-pill ${role}`;
    }

    // Hide "Delete" actions for non-admins on orders/customers tables (redraw after)
    // We also gate the product edit/delete buttons — re-renders pick up the gate
    window.__currentRole = role;
}

/* =========================================================
   DASHBOARD
   ========================================================= */
function renderDashboard() {
    const orders = lsGet(LS.ORDERS, []);
    const users  = collectAllUsers();
    const products = getProducts();

    $('#stat-revenue').textContent   = '€' + orders.reduce((s,o) => s + (o.total || 0), 0).toFixed(2);
    $('#stat-orders').textContent    = orders.length;
    $('#stat-customers').textContent = users.length;
    $('#stat-products').textContent  = products.length;

    const tbody = $('#recent-orders-table tbody');
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No orders yet. Place one from the store to see it here.</td></tr>';
        return;
    }
    tbody.innerHTML = orders.slice(-8).reverse().map(o => `
        <tr>
            <td><strong>#${o.number}</strong></td>
            <td>${escapeHtml(o.customer || 'Guest')}</td>
            <td>${o.items.reduce((s,i) => s + i.qty, 0)}</td>
            <td class="price-tag">€${o.total.toFixed(2)}</td>
            <td>${formatDate(o.createdAt)}</td>
        </tr>`).join('');
}

/* =========================================================
   PRODUCTS
   ========================================================= */
function renderProducts() {
    const role = window.__currentRole || getActiveSession()?.role || 'admin';
    const canEdit = hasPermission(role, 'products:edit');
    const products = getProducts();
    const tbody = $('#products-table tbody');
    tbody.innerHTML = products.map(p => `
        <tr data-id="${p.id}">
            <td><strong>${escapeHtml(p.name)}</strong></td>
            <td>${escapeHtml(p.category)}</td>
            <td class="price-tag">€${p.price.toFixed(2)}</td>
            <td>${p.badge ? `<span class="badge-pill">${escapeHtml(p.badge)}</span>` : '—'}</td>
            <td>
                ${canEdit ? `<button class="btn-small" data-action="edit">Edit</button>` : ''}
                ${canEdit ? `<button class="btn-small danger" data-action="delete">Delete</button>` : '<span style="color:var(--muted);font-size:11px;">Read only</span>'}
            </td>
        </tr>`).join('');

    $$('#products-table tbody tr').forEach(row => {
        const id = row.dataset.id;
        const editBtn = row.querySelector('[data-action="edit"]');
        const delBtn = row.querySelector('[data-action="delete"]');
        if (editBtn) editBtn.addEventListener('click', () => {
            const p = getProducts().find(x => x.id === id);
            openProductModal(p);
        });
        if (delBtn) delBtn.addEventListener('click', () => {
            if (!confirm('Delete this product?')) return;
            const list = getProducts().filter(x => x.id !== id);
            saveProducts(list);
            renderProducts(); renderDashboard();
        });
    });
}

function openProductModal(product) {
    const modal = $('#product-modal');
    modal.classList.remove('hidden');
    $('#product-modal-title').textContent = product ? 'Edit product' : 'New product';
    $('#p-id').value       = product?.id || '';
    $('#p-name').value     = product?.name || '';
    $('#p-category').value = product?.category || '';
    $('#p-price').value    = product?.price?.toFixed(2) || '';
    $('#p-badge').value    = product?.badge || '';
    $('#p-symbol').value   = product?.symbol || '◯';

    // Image fields
    const imageData = product?.image || '';
    $('#p-image-data').value = imageData;
    $('#p-image').value = ''; // clear file picker
    const wrap = $('#p-image-preview');
    const img  = $('#p-image-preview-img');
    if (imageData) {
        img.src = imageData;
        wrap.classList.remove('hidden');
    } else {
        img.removeAttribute('src');
        wrap.classList.add('hidden');
    }
}
function closeProductModal() {
    $('#product-modal').classList.add('hidden');
    // Clear file input and preview
    $('#p-image').value = '';
    $('#p-image-data').value = '';
    const wrap = $('#p-image-preview');
    const img  = $('#p-image-preview-img');
    if (img) img.removeAttribute('src');
    if (wrap) wrap.classList.add('hidden');
}

function saveProductHandler(e) {
    e.preventDefault();
    const id = $('#p-id').value;
    const updated = {
        id: id || slugify($('#p-name').value),
        name: $('#p-name').value.trim(),
        category: $('#p-category').value.trim(),
        price: parseFloat($('#p-price').value),
        badge: $('#p-badge').value.trim().toUpperCase(),
        symbol: $('#p-symbol').value.trim() || '◯',
        image: $('#p-image-data').value || ''
    };
    const list = getProducts();
    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) list[idx] = updated;
    else list.push(updated);
    saveProducts(list);
    closeProductModal();
    renderProducts(); renderDashboard();
}

/* Downscale large images client-side so localStorage doesn't fill up */
function downscaleImage(file, maxSize = 800, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxSize || height > maxSize) {
                    if (width > height) { height = Math.round(height * maxSize / width); width = maxSize; }
                    else { width = Math.round(width * maxSize / height); height = maxSize; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function slugify(s) {
    return (s || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        .slice(0, 40) || ('item-' + Math.random().toString(36).slice(2, 7));
}

/* =========================================================
   ORDERS
   ========================================================= */
function renderOrders() {
    const orders = lsGet(LS.ORDERS, []);
    const tbody = $('#orders-table tbody');
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No orders yet.</td></tr>';
        return;
    }
    const role = window.__currentRole || getActiveSession()?.role || 'admin';
    const canDelete = hasPermission(role, 'orders:delete');
    tbody.innerHTML = orders.slice().reverse().map(o => {
        const status = o.status || 'Pending';
        const statusClass = status.toLowerCase();
        return `
        <tr data-id="${o.number}">
            <td><strong>#${o.number}</strong></td>
            <td>${escapeHtml(o.customer || 'Guest')}</td>
            <td>${escapeHtml(o.email || '—')}</td>
            <td>${o.items.reduce((s,i) => s + i.qty, 0)}</td>
            <td class="price-tag">€${o.total.toFixed(2)}</td>
            <td><span class="status-pill ${statusClass}">${escapeHtml(status)}</span></td>
            <td>${formatDate(o.createdAt)}</td>
            <td>
                <button class="btn-small" data-action="view">View</button>
                ${canDelete ? `<button class="btn-small danger" data-action="delete">Delete</button>` : ''}
            </td>
        </tr>`;
    }).join('');

    $$('#orders-table tbody tr').forEach(row => {
        const number = parseInt(row.dataset.id, 10);
        row.querySelector('[data-action="view"]').addEventListener('click', () => {
            const o = lsGet(LS.ORDERS, []).find(x => x.number === number);
            showOrderDetails(o);
        });
        const delBtn = row.querySelector('[data-action="delete"]');
        if (delBtn) delBtn.addEventListener('click', () => {
            if (!confirm('Delete this order?')) return;
            const list = lsGet(LS.ORDERS, []).filter(x => x.number !== number);
            lsSet(LS.ORDERS, list);
            renderOrders(); renderDashboard();
        });
    });
}

function showOrderDetails(o) {
    if (!o) return;
    const body = $('#order-details-body');
    const currentStatus = o.status || 'Pending';
    const history = Array.isArray(o.statusHistory) && o.statusHistory.length
        ? o.statusHistory
        : [{ status: currentStatus, at: o.createdAt }];
    const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
        .map(s => `<option${s === currentStatus ? ' selected' : ''}>${s}</option>`).join('');

    body.innerHTML = `
        <div class="order-update-form">
            <h3 style="font-family:'Cormorant Garamond',serif;font-size:18px;margin:20px 0 12px;">Update order</h3>
            <label style="font-size:10px;letter-spacing:0.2em;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:6px;">Status</label>
            <select id="order-status-select" class="status-select" style="width:100%;margin-bottom:14px;">
                ${statusOptions}
            </select>
            <div class="tracking-input-row" style="margin-bottom:10px;">
                <input type="text" id="order-tracking-number" placeholder="Tracking number" value="${escapeHtml(o.trackingNumber || '')}">
                <input type="text" id="order-carrier" placeholder="Carrier (La Poste, DHL...)" value="${escapeHtml(o.carrier || '')}">
            </div>
            <input type="url" id="order-tracking-url" placeholder="Tracking URL (optional)" value="${escapeHtml(o.trackingUrl || '')}" style="width:100%;margin-bottom:14px;padding:10px 14px;border:1px solid var(--line-2);">
            <button type="button" class="btn-primary" id="save-order-update">SAVE UPDATES</button>
            <p class="save-status" id="order-update-status"></p>
        </div>
        <dl class="order-meta">
            <dt>Order #</dt><dd>${o.number}</dd>
            <dt>Customer</dt><dd>${escapeHtml(o.customer || 'Guest')}</dd>
            <dt>Email</dt><dd>${escapeHtml(o.email || '—')}</dd>
            <dt>Date</dt><dd>${formatDate(o.createdAt)}</dd>
        </dl>
        <div class="order-lines">
            ${o.items.map(i => `
                <div class="order-line">
                    <span>${escapeHtml(i.name)}</span>
                    <span class="line-qty">× ${i.qty}</span>
                    <span>€${(i.price * i.qty).toFixed(2)}</span>
                </div>`).join('')}
        </div>
        <div class="order-total">
            <span>TOTAL</span><span>€${o.total.toFixed(2)}</span>
        </div>
        <div class="status-timeline">
            <h3>Status history</h3>
            <ul>
                ${history.slice().reverse().map(h => `
                    <li>
                        <span class="status-pill ${(h.status || '').toLowerCase()}">${escapeHtml(h.status || '')}</span>
                        <span class="timeline-date">${formatDate(h.at)}</span>
                    </li>`).join('')}
            </ul>
        </div>`;

    $('#save-order-update').addEventListener('click', () => saveOrderUpdate(o.number));
    $('#order-modal').classList.remove('hidden');
}

function saveOrderUpdate(number) {
    const list = lsGet(LS.ORDERS, []);
    const idx = list.findIndex(x => x.number === number);
    if (idx < 0) return;
    const order = list[idx];
    const newStatus = $('#order-status-select').value;
    const oldStatus = order.status || 'Pending';

    order.trackingNumber = $('#order-tracking-number').value.trim();
    order.carrier = $('#order-carrier').value.trim();
    order.trackingUrl = $('#order-tracking-url').value.trim();
    order.status = newStatus;

    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
    if (newStatus !== oldStatus) {
        order.statusHistory.push({ status: newStatus, at: Date.now() });
    }

    list[idx] = order;
    lsSet(LS.ORDERS, list);

    const status = $('#order-update-status');
    status.className = 'save-status ok';
    status.textContent = '✓ Saved.';

    renderOrders();
    showOrderDetails(order);
    // Re-apply the saved message after re-render
    const s2 = $('#order-update-status');
    if (s2) { s2.className = 'save-status ok'; s2.textContent = '✓ Saved.'; }
}

/* =========================================================
   CUSTOMERS
   ========================================================= */
function collectAllUsers() {
    const list = lsGet(LS.USERS, []);
    const legacy = lsGet('cartheon_user');
    if (legacy && !list.some(u => u.email === legacy.email)) {
        list.push({ ...legacy, createdAt: Date.now() });
        lsSet(LS.USERS, list);
    }
    return list;
}

function renderCustomers() {
    const role = window.__currentRole || getActiveSession()?.role || 'admin';
    const canDelete = hasPermission(role, 'customers:delete');
    const list = collectAllUsers();
    const tbody = $('#customers-table tbody');
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No customers yet.</td></tr>';
        return;
    }
    tbody.innerHTML = list.slice().reverse().map(u => `
        <tr data-email="${escapeHtml(u.email)}">
            <td><strong>${escapeHtml(u.name || '—')}</strong></td>
            <td>${escapeHtml(u.email)}</td>
            <td>${formatDate(u.createdAt)}</td>
            <td>${canDelete ? '<button class="btn-small danger" data-action="delete">Delete</button>' : '<span style="color:var(--muted);font-size:11px;">Read only</span>'}</td>
        </tr>`).join('');

    $$('#customers-table tbody tr').forEach(row => {
        const email = row.dataset.email;
        const delBtn = row.querySelector('[data-action="delete"]');
        if (delBtn) delBtn.addEventListener('click', () => {
            if (!confirm('Delete this customer record?')) return;
            const list = collectAllUsers().filter(u => u.email !== email);
            lsSet(LS.USERS, list);
            renderCustomers(); renderDashboard();
        });
    });
}

/* =========================================================
   TEAM MANAGEMENT
   ========================================================= */
function renderTeam() {
    const session = getActiveSession();
    if (!session) return;
    const users = getUsers();
    const tbody = $('#team-table tbody');
    const isAdmin = session.role === 'admin';
    const currentId = session.userId;

    // Refresh pending-approvals panel first so sweep runs before render
    renderPendingApprovals();

    const pendingTargets = new Set(
        sweepPendingActions()
            .filter(pa => pa.status === 'pending' && pa.targetUserId)
            .map(pa => pa.targetUserId)
    );

    tbody.innerHTML = users.map(u => {
        const isSelf = u.id === currentId;
        const canModify = isAdmin; // only admins can modify anyone
        const canChangeRole = isAdmin && !isSelf; // cannot demote yourself
        const canDelete = isAdmin && !isSelf;
        const hasPending = pendingTargets.has(u.id);

        // Role cell: a quick-change dropdown OR a static pill
        const rolePill = `<span class="role-pill ${escapeHtml(u.role)}">${escapeHtml((ROLES[u.role] || ROLES.admin).label)}</span>`;
        const roleCell = canChangeRole
            ? `
                <div class="role-change-wrap">
                    ${rolePill}
                    <select class="role-change" data-userid="${u.id}" aria-label="Change role">
                        ${VALID_ROLES.map(r => `<option value="${r}"${r === u.role ? ' selected' : ''}>${escapeHtml(ROLES[r].label)}</option>`).join('')}
                    </select>
                </div>`
            : rolePill;

        const pendingBadge = hasPending
            ? ' <span class="pending-badge" title="Pending admin approval for this user">Pending approval</span>'
            : '';

        return `
            <tr data-id="${u.id}">
                <td><strong>${escapeHtml(u.username)}</strong>${isSelf ? ' <span style="color:var(--muted);font-weight:400;">(you)</span>' : ''}${pendingBadge}</td>
                <td>${escapeHtml(u.email || '—')}</td>
                <td>${roleCell}</td>
                <td>${formatDate(u.createdAt)}</td>
                <td>
                    ${canModify ? `<button class="btn-small" data-action="edit">Edit</button>` : ''}
                    ${canModify ? `<button class="btn-small" data-action="reset-pw">Reset PW</button>` : ''}
                    ${canDelete ? `<button class="btn-small danger" data-action="delete">Delete</button>` : ''}
                </td>
            </tr>`;
    }).join('');

    $$('#team-table tbody tr').forEach(row => {
        const id = row.dataset.id;
        const editBtn    = row.querySelector('[data-action="edit"]');
        const pwBtn      = row.querySelector('[data-action="reset-pw"]');
        const delBtn     = row.querySelector('[data-action="delete"]');
        const roleSelect = row.querySelector('.role-change');

        if (editBtn) editBtn.addEventListener('click', () => openTeamModal(findUserById(id)));
        if (pwBtn)   pwBtn.addEventListener('click', () => resetTeamMemberPassword(id));
        if (delBtn)  delBtn.addEventListener('click', async () => {
            const u = findUserById(id);
            if (!u) return;
            const sess = getActiveSession();

            // Admin deletions require second-admin approval (no bootstrap exception — deletion reduces admins)
            if (u.role === 'admin' && adminActionsRequireApproval()) {
                if (sweepPendingActions().some(pa =>
                        pa.status === 'pending' && pa.type === 'delete_admin' && pa.targetUserId === id)) {
                    alert('A pending deletion request already exists for this admin.');
                    return;
                }
                const otherAdmins = getUsers().filter(x => x.role === 'admin' && x.id !== id);
                if (otherAdmins.length === 0) {
                    alert('Cannot delete the last admin — promote someone else first.');
                    return;
                }
                if (!confirm(`Deleting an admin requires a second admin's approval.\n\nRequest to delete "${u.username}"?`)) return;
                const pa = createPendingAction({
                    type: 'delete_admin',
                    targetUserId: id,
                    requestedBy: { userId: sess.userId, username: sess.user }
                });
                renderTeam();
                renderDashboard();
                showApprovalInfoModal(pa);
                return;
            }

            if (!confirm(`Delete the "${u.username}" account? This cannot be undone.`)) return;
            try { deleteUser(id); purgePendingForUser(id); renderTeam(); renderDashboard(); }
            catch (err) { alert(err.message || 'Delete failed.'); }
        });
        if (roleSelect) {
            roleSelect.addEventListener('change', (e) => quickChangeRole(id, e.target.value, e.target));
        }
    });

    renderRolesReference();
}

function renderRolesReference() {
    const grid = document.getElementById('roles-reference-grid');
    if (!grid) return;
    grid.innerHTML = VALID_ROLES.map(r => {
        const role = ROLES[r];
        const counts = getUsers().filter(u => u.role === r).length;
        return `
            <div class="role-card">
                <div class="role-card-header">
                    <span class="role-pill ${escapeHtml(r)}">${escapeHtml(role.label)}</span>
                    <span class="role-card-count">${counts} ${counts === 1 ? 'user' : 'users'}</span>
                </div>
                <p class="role-card-desc">${escapeHtml(role.description)}</p>
                <ul class="role-card-perms">
                    ${permissionList(r).map(p => `<li>${p.ok ? '✓' : '×'} <span class="${p.ok ? 'perm-yes' : 'perm-no'}">${escapeHtml(p.label)}</span></li>`).join('')}
                </ul>
            </div>`;
    }).join('');
}

function renderPendingApprovals() {
    const wrap = document.getElementById('pending-approvals');
    const list = document.getElementById('pending-approvals-list');
    const countEl = document.getElementById('pending-count');
    if (!wrap || !list) return;

    const session = getActiveSession();
    if (!session || session.role !== 'admin') {
        wrap.classList.add('hidden');
        return;
    }
    wrap.classList.remove('hidden');

    const all = sweepPendingActions();
    // Visible: pending + recently-rejected/expired (retention window already bounded by sweep)
    const visible = all.filter(pa => pa.status !== 'approved')
                       .slice()
                       .sort((a, b) => b.requestedAt - a.requestedAt);
    const pendingCount = visible.filter(pa => pa.status === 'pending').length;

    if (countEl) countEl.textContent = `(${pendingCount})`;

    if (visible.length === 0) {
        list.innerHTML = '<p class="pending-empty">No pending requests.</p>';
        return;
    }

    const now = Date.now();
    list.innerHTML = visible.map(pa => {
        const icon = pendingActionIcon(pa.type);
        const summary = describePendingAction(pa);
        const requester = pa.requestedBy?.username || '(unknown)';
        const age = humanAge(now - pa.requestedAt);
        const isOwn = pa.requestedBy?.userId === session.userId;
        const canAct = pa.status === 'pending' && !isOwn;

        let statusPill = '';
        if (pa.status === 'pending') {
            statusPill = isOwn
                ? `<span class="pending-status pending-self">Awaiting another admin</span>`
                : `<span class="pending-status pending-open">Awaiting approval</span>`;
        } else if (pa.status === 'rejected') {
            const by = pa.rejectedBy?.username || '(unknown)';
            statusPill = `<span class="pending-status pending-rejected">Rejected by ${escapeHtml(by)}</span>`;
        } else if (pa.status === 'expired') {
            statusPill = `<span class="pending-status pending-expired">Expired</span>`;
        }

        const expiresLine = pa.status === 'pending'
            ? `<span class="pending-expires">Expires in ${humanAge(pa.expiresAt - now)}</span>`
            : '';

        const actions = canAct
            ? `
                <div class="pending-actions">
                    <button class="btn-small" data-pa-action="approve" data-pa-id="${pa.id}">Approve</button>
                    <button class="btn-small danger" data-pa-action="reject" data-pa-id="${pa.id}">Reject</button>
                </div>`
            : (pa.status === 'pending' && isOwn
                ? `<div class="pending-actions"><span class="pending-muted">You cannot approve your own request</span></div>`
                : '');

        return `
            <div class="pending-action-card pending-action-${escapeHtml(pa.type)} pending-action-status-${escapeHtml(pa.status)}">
                <div class="pending-action-icon">${icon}</div>
                <div class="pending-action-body">
                    <div class="pending-action-type">${escapeHtml(summary)}</div>
                    <div class="pending-action-meta">
                        Requested by <strong>${escapeHtml(requester)}</strong> · ${escapeHtml(age)} ago
                        ${expiresLine ? ` · ${expiresLine}` : ''}
                    </div>
                    ${statusPill}
                </div>
                ${actions}
            </div>`;
    }).join('');

    // Wire buttons
    list.querySelectorAll('[data-pa-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-pa-id');
            const action = btn.getAttribute('data-pa-action');
            if (action === 'approve') approvePendingAction(id);
            else if (action === 'reject') rejectPendingAction(id);
        });
    });
}

function pendingActionIcon(type) {
    switch (type) {
        case 'create_admin':      return '+';
        case 'promote_to_admin':  return '↑';
        case 'demote_admin':      return '↓';
        case 'delete_admin':      return '×';
        default:                  return '?';
    }
}

function humanAge(ms) {
    if (ms < 0) ms = 0;
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? '' : 's'}`;
}

async function approvePendingAction(paId) {
    const session = getActiveSession();
    if (!session || session.role !== 'admin') { alert('Only admins can approve.'); return; }

    const list = sweepPendingActions();
    const pa = list.find(x => x.id === paId);
    if (!pa) { alert('Request not found.'); renderPendingApprovals(); return; }
    if (pa.status !== 'pending') { alert(`This request is ${pa.status}.`); renderPendingApprovals(); return; }
    if (pa.requestedBy?.userId === session.userId) {
        alert('You cannot approve your own request.'); return;
    }
    if (Date.now() > pa.expiresAt) {
        pa.status = 'expired';
        pa.resolvedAt = Date.now();
        savePendingActions(list);
        alert('This request has expired.');
        renderPendingApprovals();
        return;
    }
    if (!confirm(`Approve this request?\n\n${describePendingAction(pa)}`)) return;

    const result = await executePendingAction(pa);
    if (!result.ok) {
        alert('Could not execute: ' + (result.reason || 'unknown error'));
        return;
    }

    // Re-fetch after execution because the user list may have changed
    const fresh = getPendingActions();
    const idx = fresh.findIndex(x => x.id === paId);
    if (idx >= 0) {
        const approvers = Array.isArray(fresh[idx].approvedBy) ? fresh[idx].approvedBy.slice() : [];
        if (!approvers.includes(session.userId)) approvers.push(session.userId);
        fresh[idx].approvedBy = approvers;
        fresh[idx].status = 'approved';
        fresh[idx].resolvedAt = Date.now();
        savePendingActions(fresh);
    }

    alert(`Approved: ${describePendingAction(pa)}`);
    renderTeam();
    renderDashboard();
}

function rejectPendingAction(paId) {
    const session = getActiveSession();
    if (!session || session.role !== 'admin') { alert('Only admins can reject.'); return; }

    const list = sweepPendingActions();
    const idx = list.findIndex(x => x.id === paId);
    if (idx < 0) { alert('Request not found.'); renderPendingApprovals(); return; }
    const pa = list[idx];
    if (pa.status !== 'pending') { alert(`This request is ${pa.status}.`); renderPendingApprovals(); return; }
    if (pa.requestedBy?.userId === session.userId) {
        alert('You cannot reject your own request. Simply let it expire, or another admin can close it.'); return;
    }
    if (!confirm(`Reject this request?\n\n${describePendingAction(pa)}\n\nThe action will not take effect.`)) return;

    list[idx].status = 'rejected';
    list[idx].rejectedBy = { userId: session.userId, username: session.user, at: Date.now() };
    list[idx].resolvedAt = Date.now();
    savePendingActions(list);
    renderPendingApprovals();
    renderTeam();
}

function showApprovalInfoModal(pa) {
    const modal = document.getElementById('approval-info-modal');
    if (!modal) return;
    const summary = document.getElementById('approval-info-summary');
    if (summary) summary.textContent = describePendingAction(pa);
    modal.classList.remove('hidden');

    const close = () => modal.classList.add('hidden');

    const closeBtn = document.getElementById('approval-info-close');
    const dismissBtn = document.getElementById('approval-info-dismiss');
    const viewBtn = document.getElementById('approval-info-view');

    if (closeBtn)   closeBtn.onclick = close;
    if (dismissBtn) dismissBtn.onclick = close;
    if (viewBtn)    viewBtn.onclick = () => {
        close();
        // Switch to team view & scroll to pending panel
        document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.dataset.view === 'team'));
        document.querySelectorAll('.sb-link').forEach(b => b.classList.toggle('active', b.dataset.view === 'team'));
        renderTeam();
        const panel = document.getElementById('pending-approvals');
        if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
}

function permissionList(role) {
    // Nice human-readable listing — shown with ✓ / × in the reference grid
    const allPerms = [
        { key: 'team:manage',         label: 'Manage team members' },
        { key: 'products:edit',       label: 'Add/edit/delete products' },
        { key: 'orders:edit',         label: 'View & edit orders' },
        { key: 'orders:update-status',label: 'Update order status & tracking' },
        { key: 'orders:delete',       label: 'Delete orders' },
        { key: 'customers:edit',      label: 'View & edit customers' },
        { key: 'customers:delete',    label: 'Delete customers' },
        { key: 'settings:dangerous',  label: 'Clear/reset store data' },
        { key: 'export-data',         label: 'Export backup JSON' }
    ];
    return allPerms.map(p => ({ label: p.label, ok: hasPermission(role, p.key) }));
}

async function quickChangeRole(userId, newRole, selectEl) {
    const session = getActiveSession();
    if (!session || session.role !== 'admin') { alert('Only admins can change roles.'); renderTeam(); return; }
    if (userId === session.userId) { alert('You cannot change your own role.'); renderTeam(); return; }
    if (!VALID_ROLES.includes(newRole)) { alert('Invalid role.'); renderTeam(); return; }

    const user = findUserById(userId);
    if (!user) return;
    if (user.role === newRole) { renderTeam(); return; }

    // If the change would remove the last admin, block it
    if (user.role === 'admin' && newRole !== 'admin') {
        const otherAdmins = getUsers().filter(u => u.role === 'admin' && u.id !== userId);
        if (otherAdmins.length === 0) {
            alert('Cannot demote the last admin — promote someone else first.');
            renderTeam();
            return;
        }
    }

    const promotingToAdmin = newRole === 'admin';
    const demotingAdmin    = user.role === 'admin' && newRole !== 'admin';
    const needsApproval = (promotingToAdmin || demotingAdmin) && adminActionsRequireApproval();

    if (needsApproval) {
        if (sweepPendingActions().some(pa =>
                pa.status === 'pending' && pa.targetUserId === userId
                && (pa.type === 'promote_to_admin' || pa.type === 'demote_admin'))) {
            alert('A pending role-change request already exists for this user.');
            renderTeam();
            return;
        }
        const verb = promotingToAdmin ? 'promote to Admin' : `demote from Admin to ${ROLES[newRole].label}`;
        if (!confirm(`This action requires a second admin's approval.\n\nRequest to ${verb} ${user.username}?`)) {
            renderTeam();
            return;
        }
        const pa = createPendingAction({
            type: promotingToAdmin ? 'promote_to_admin' : 'demote_admin',
            targetUserId: userId,
            newRole,
            requestedBy: { userId: session.userId, username: session.user }
        });
        renderTeam();
        renderDashboard();
        showApprovalInfoModal(pa);
        return;
    }

    if (!confirm(`Change ${user.username}'s role from ${ROLES[user.role].label} to ${ROLES[newRole].label}?`)) {
        renderTeam();
        return;
    }

    try {
        updateUser(userId, { role: newRole });
        renderTeam();
        renderDashboard();
    } catch (err) {
        alert(err.message || 'Failed to change role.');
        renderTeam();
    }
}

function openTeamModal(existingUser) {
    const modal = $('#team-modal');
    modal.classList.remove('hidden');
    const isEdit = !!existingUser;
    $('#team-modal-title').textContent = isEdit ? `Edit ${existingUser.username}` : 'Add team member';
    $('#tm-id').value       = existingUser?.id || '';
    $('#tm-username').value = existingUser?.username || '';
    $('#tm-email').value    = existingUser?.email || '';
    $('#tm-role').value     = existingUser?.role || 'manager';
    $('#tm-password').value = '';
    $('#tm-error').textContent = '';

    // When editing, password is not changed here (use Reset PW button instead)
    const pwLabel = $('#tm-password-label');
    const pwNote  = $('#tm-password-note');
    if (isEdit) {
        pwLabel.style.display = 'none';
        pwNote.textContent = 'To change this user\'s password, close this dialog and click "Reset PW".';
    } else {
        pwLabel.style.display = '';
        $('#tm-password').required = true;
        pwNote.textContent = 'Set their initial password and share it with them securely. They can change it after their first sign-in.';
    }
    updateRoleDescription();
}

function closeTeamModal() {
    $('#team-modal').classList.add('hidden');
    $('#team-form').reset();
    $('#tm-id').value = '';
    $('#tm-error').textContent = '';
    $('#tm-password').required = false;
    $('#tm-password-label').style.display = '';
}

function updateRoleDescription() {
    const role = $('#tm-role').value;
    $('#tm-role-description').textContent = (ROLES[role] || ROLES.admin).description;
}

async function saveTeamMemberHandler(e) {
    e.preventDefault();
    const err = $('#tm-error');
    err.textContent = '';
    const session = getActiveSession();
    if (!session || session.role !== 'admin') {
        err.textContent = 'Only admins can manage the team.'; return;
    }

    const id       = $('#tm-id').value;
    const username = $('#tm-username').value.trim();
    const email    = $('#tm-email').value.trim();
    const role     = $('#tm-role').value;
    const password = $('#tm-password').value;

    if (username.length < 3) { err.textContent = 'Username must be at least 3 characters.'; return; }
    if (!/.+@.+\..+/.test(email)) { err.textContent = 'Please provide a valid email.'; return; }
    if (!VALID_ROLES.includes(role)) { err.textContent = 'Invalid role.'; return; }

    $('#tm-submit').disabled = true;
    $('#tm-submit').textContent = 'SAVING…';

    try {
        if (id) {
            // ===== EDIT EXISTING USER =====
            const existing = findUserById(id);
            if (!existing) throw new Error('User not found.');

            if (id === session.userId && role !== 'admin') {
                err.textContent = 'You cannot demote your own admin account.'; return;
            }
            if (role !== 'admin') {
                const admins = getUsers().filter(u => u.role === 'admin' && u.id !== id);
                if (admins.length === 0) {
                    err.textContent = 'Cannot demote the last admin.'; return;
                }
            }

            const roleChanged = existing.role !== role;
            const promotingToAdmin = roleChanged && role === 'admin';
            const demotingAdmin    = roleChanged && existing.role === 'admin' && role !== 'admin';

            // Username/email changes always go direct. Only the ROLE change may require approval.
            const metadataChanged = existing.username !== username || (existing.email || '') !== (email || '').toLowerCase();
            if (metadataChanged) {
                updateUser(id, { username, email });
            }

            if (roleChanged && (promotingToAdmin || demotingAdmin) && adminActionsRequireApproval()) {
                // Avoid double-queuing
                if (sweepPendingActions().some(pa =>
                        pa.status === 'pending' && pa.targetUserId === id
                        && (pa.type === 'promote_to_admin' || pa.type === 'demote_admin'))) {
                    err.textContent = 'A pending role-change request already exists for this user.'; return;
                }
                const pa = createPendingAction({
                    type: promotingToAdmin ? 'promote_to_admin' : 'demote_admin',
                    targetUserId: id,
                    newRole: role,
                    requestedBy: { userId: session.userId, username: session.user }
                });
                closeTeamModal();
                renderTeam();
                renderDashboard();
                showApprovalInfoModal(pa);
                return;
            }

            if (roleChanged) {
                updateUser(id, { role });
            }
        } else {
            // ===== CREATE NEW USER =====
            if (password.length < 8) { err.textContent = 'Password must be at least 8 characters.'; return; }
            if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
                err.textContent = 'Password needs at least one letter and one number.'; return;
            }
            if (usernameIsTaken(username)) { err.textContent = 'A user with that username already exists.'; return; }

            if (role === 'admin' && adminActionsRequireApproval()) {
                if (hasPendingCreateAdminForUsername(username)) {
                    err.textContent = 'A pending request already exists for this username.'; return;
                }
                // Hash locally — plaintext must NEVER be stored in pending
                const saltBytes = randomBytes(16);
                const hash = await pbkdf2Hash(password, saltBytes, PBKDF2_ITERATIONS);
                const pa = createPendingAction({
                    type: 'create_admin',
                    target: {
                        username,
                        email: (email || '').toLowerCase(),
                        salt: bytesToHex(saltBytes),
                        hash,
                        iterations: PBKDF2_ITERATIONS
                    },
                    requestedBy: { userId: session.userId, username: session.user }
                });
                closeTeamModal();
                renderTeam();
                renderDashboard();
                showApprovalInfoModal(pa);
                return;
            }

            // Direct create path (non-admin role, or bootstrap single-admin admin create)
            await createAdmin(username, password, email, role, session.userId);
        }

        closeTeamModal();
        renderTeam();
        renderDashboard();
    } catch (error) {
        err.textContent = error.message || 'Save failed.';
    } finally {
        $('#tm-submit').disabled = false;
        $('#tm-submit').textContent = 'SAVE';
    }
}

async function resetTeamMemberPassword(userId) {
    const session = getActiveSession();
    if (!session || session.role !== 'admin') { alert('Only admins can reset passwords.'); return; }
    const u = findUserById(userId);
    if (!u) return;

    const pass = prompt(`Enter a NEW password for ${u.username} (min 8 chars, letters + numbers):`);
    if (pass == null) return;
    if (pass.length < 8 || !/[A-Za-z]/.test(pass) || !/[0-9]/.test(pass)) {
        alert('Password must be at least 8 chars with letters and numbers.');
        return;
    }
    try {
        await updateUserPassword(userId, pass);
        alert(`Password reset.\n\nShare this new password with ${u.username} securely. They can change it after signing in.`);
    } catch (err) {
        alert(err.message || 'Reset failed.');
    }
}

/* =========================================================
   SETTINGS
   ========================================================= */
async function saveCredentialsHandler(e) {
    e.preventDefault();
    const status = $('#cred-status');
    status.className = 'save-status';
    status.textContent = '';

    const newUser  = $('#new-username').value.trim();
    const newEmail = $('#new-email').value.trim();
    const newPass  = $('#new-password').value;
    const confirmP = $('#confirm-password').value;

    const session = getActiveSession();
    if (!session) { status.textContent = 'Session expired.'; status.classList.add('err'); return; }

    if (newUser.length < 3) {
        status.textContent = 'Username too short.'; status.classList.add('err'); return;
    }
    if (!/.+@.+\..+/.test(newEmail)) {
        status.textContent = 'Please provide a valid recovery email.'; status.classList.add('err'); return;
    }

    try {
        // Update username + email for the CURRENT user
        updateUser(session.userId, { username: newUser, email: newEmail });
    } catch (err) {
        status.textContent = err.message || 'Could not save changes.'; status.classList.add('err'); return;
    }

    if (newPass) {
        if (newPass.length < 8) { status.textContent = 'Password must be at least 8 characters.'; status.classList.add('err'); return; }
        if (!/[A-Za-z]/.test(newPass) || !/[0-9]/.test(newPass)) {
            status.textContent = 'Password needs at least one letter and one number.'; status.classList.add('err'); return;
        }
        if (newPass !== confirmP) { status.textContent = 'Passwords do not match.'; status.classList.add('err'); return; }
        await updateUserPassword(session.userId, newPass);
    }

    // Refresh session username
    const s = ssGet(SS.SESSION);
    if (s) { s.user = newUser; ssSet(SS.SESSION, s); }
    $('#admin-name').textContent = newUser;

    $('#new-password').value = '';
    $('#confirm-password').value = '';
    status.textContent = '✓ Saved.'; status.classList.add('ok');
}

function exportData() {
    const payload = {
        exportedAt: new Date().toISOString(),
        products:  getProducts(),
        orders:    lsGet(LS.ORDERS, []),
        customers: collectAllUsers()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cartheon-backup-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
}

/* =========================================================
   UTILITIES
   ========================================================= */
function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
         + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
