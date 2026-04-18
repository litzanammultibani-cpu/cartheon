/* =========================================================
   CARTHEON — Interactive storefront
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- Helpers ---------- */
    const $  = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const body = document.body;

    const lockScroll   = () => body.classList.add('no-scroll');
    const unlockScroll = () => body.classList.remove('no-scroll');

    /* =========================================================
       APPLY ADMIN PRODUCT OVERRIDES (from localStorage)
       The admin panel can customize/add products. Any product
       saved in `cartheon_products` overrides or extends the static
       DOM product cards before anything else reads them.
       ========================================================= */
    (function applyAdminProducts() {
        let stored;
        try { stored = JSON.parse(localStorage.getItem('cartheon_products')); }
        catch { stored = null; }
        if (!Array.isArray(stored)) return;

        const grid = $('.products-grid');

        stored.forEach(p => {
            if (!p || !p.id) return;
            let card = document.querySelector(`.product-card[data-id="${cssEscape(p.id)}"]`);

            if (!card) {
                // Admin added a new product that's not in the static DOM — create one.
                if (!grid) return;
                card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.id       = p.id;
                card.dataset.name     = p.name || '';
                card.dataset.price    = (typeof p.price === 'number' ? p.price.toFixed(2) : (p.price || '0.00'));
                card.dataset.category = p.category || '';
                card.innerHTML = `
                    <div class="product-image" style="background: linear-gradient(135deg, #f5f5f5 0%, #d0d0d0 100%);">
                        <span class="product-placeholder">${escapeHtmlOuter(p.symbol || '◯')}</span>
                        ${p.badge ? `<span class="product-badge">${escapeHtmlOuter(p.badge)}</span>` : ''}
                        <button class="product-add" aria-label="Add to bag">ADD TO BAG</button>
                    </div>
                    <h4>${escapeHtmlOuter(p.name || '')}</h4>
                    <p class="product-category">${escapeHtmlOuter(p.category || '')}</p>
                    <p class="product-price">€${(Number(p.price) || 0).toFixed(2)}</p>
                `;
                grid.appendChild(card);
            } else {
                // Update existing card with admin edits
                if (p.name !== undefined)     { card.dataset.name = p.name; const h = card.querySelector('h4'); if (h) h.textContent = p.name; }
                if (p.price !== undefined)    {
                    const priceNum = Number(p.price) || 0;
                    card.dataset.price = priceNum.toFixed(2);
                    const pp = card.querySelector('.product-price');
                    if (pp) pp.textContent = `€${priceNum.toFixed(2)}`;
                }
                if (p.category !== undefined) {
                    card.dataset.category = p.category;
                    const pc = card.querySelector('.product-category');
                    if (pc) pc.textContent = p.category;
                }
                if (p.symbol !== undefined) {
                    const ph = card.querySelector('.product-placeholder');
                    if (ph) ph.textContent = p.symbol || '◯';
                }
                // Badge: add / update / remove
                const productImage = card.querySelector('.product-image');
                let badgeEl = card.querySelector('.product-badge');
                if (p.badge) {
                    if (!badgeEl && productImage) {
                        badgeEl = document.createElement('span');
                        badgeEl.className = 'product-badge';
                        const placeholder = productImage.querySelector('.product-placeholder');
                        if (placeholder && placeholder.nextSibling) {
                            productImage.insertBefore(badgeEl, placeholder.nextSibling);
                        } else {
                            productImage.appendChild(badgeEl);
                        }
                    }
                    if (badgeEl) badgeEl.textContent = p.badge;
                } else if (badgeEl) {
                    badgeEl.remove();
                }
            }

            // Apply uploaded image (if any) — background image replaces the gradient
            if (p.image) {
                const imgWrap = card.querySelector('.product-image');
                if (imgWrap) {
                    imgWrap.style.background = `url("${p.image}") center/cover no-repeat`;
                    const ph = imgWrap.querySelector('.product-placeholder');
                    if (ph) ph.style.display = 'none';
                }
            }
        });

        function escapeHtmlOuter(s) {
            return String(s ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
        function cssEscape(s) {
            if (window.CSS && CSS.escape) return CSS.escape(s);
            return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
        }
    })();

    /* ---------- Smooth scroll for # links ---------- */
    $$('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || href === '#' || link.id === 'nav-search' ||
                link.id === 'nav-account' || link.id === 'nav-bag' ||
                link.id === 'forgot-link') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* ---------- Fade-in on scroll ---------- */
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    $$('.product-card, .collection-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        fadeObserver.observe(el);
    });

    /* =========================================================
       SEARCH OVERLAY
       ========================================================= */
    const searchOverlay = $('#search-overlay');
    const searchInput   = $('#search-input');
    const searchResults = $('#search-results');
    const searchTrigger = $('#nav-search');
    const searchClose   = $('#search-close');

    // Build product index from the DOM
    const productIndex = $$('.product-card').map(card => ({
        id:       card.dataset.id,
        name:     card.dataset.name,
        price:    parseFloat(card.dataset.price),
        category: card.dataset.category,
        imageStyle: card.querySelector('.product-image').getAttribute('style') || '',
        placeholder: card.querySelector('.product-placeholder')?.textContent || '◯',
        element:  card
    }));

    const openSearch = () => {
        searchOverlay.classList.add('open');
        searchOverlay.setAttribute('aria-hidden', 'false');
        lockScroll();
        setTimeout(() => searchInput.focus(), 80);
    };
    const closeSearch = () => {
        searchOverlay.classList.remove('open');
        searchOverlay.setAttribute('aria-hidden', 'true');
        searchInput.value = '';
        renderSearch('');
        unlockScroll();
    };

    searchTrigger.addEventListener('click', (e) => { e.preventDefault(); openSearch(); });
    searchClose.addEventListener('click', closeSearch);

    function renderSearch(query) {
        const q = query.trim().toLowerCase();
        if (!q) {
            searchResults.innerHTML = '';
            return;
        }
        const matches = productIndex.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q)
        );
        if (matches.length === 0) {
            searchResults.innerHTML = `<p class="search-empty">No pieces match "${escapeHtml(query)}". Try "silver", "chain", "tennis"...</p>`;
            return;
        }
        searchResults.innerHTML = matches.map(p => `
            <div class="search-result" data-id="${p.id}">
                <div class="search-result-image" style="${p.imageStyle}">
                    <span class="product-placeholder">${p.placeholder}</span>
                </div>
                <h5>${escapeHtml(p.name)}</h5>
                <p>${escapeHtml(p.category)} · €${p.price.toFixed(2)}</p>
            </div>`).join('');

        $$('.search-result', searchResults).forEach(el => {
            el.addEventListener('click', () => {
                closeSearch();
                const id = el.dataset.id;
                const target = productIndex.find(p => p.id === id)?.element;
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    target.style.transition = 'box-shadow 0.3s ease';
                    target.style.boxShadow = '0 0 0 2px #0a0a0a';
                    setTimeout(() => target.style.boxShadow = '', 1600);
                }
            });
        });
    }
    searchInput.addEventListener('input', e => renderSearch(e.target.value));

    /* =========================================================
       ACCOUNT MODAL
       ========================================================= */
    const accountOverlay = $('#account-overlay');
    const accountTrigger = $('#nav-account');
    const accountClose   = $('#account-close');
    const signinForm     = $('#signin-form');
    const registerForm   = $('#register-form');
    const successPanel   = $('#form-success');
    const userNameSpan   = $('#user-name');
    const successClose   = $('#success-close');

    const openAccount = () => {
        accountOverlay.classList.add('open');
        accountOverlay.setAttribute('aria-hidden', 'false');
        lockScroll();
        refreshAccountView();
    };
    const closeAccount = () => {
        accountOverlay.classList.remove('open');
        accountOverlay.setAttribute('aria-hidden', 'true');
        unlockScroll();
    };

    // accountTrigger click handled by auth-shared.js (redirects to account.html).
    // If you want the modal back on index.html, remove auth-shared.js's wireNavTriggers.
    accountClose.addEventListener('click', closeAccount);
    successClose.addEventListener('click', closeAccount);

    // Tab switching
    $$('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.tab;
            signinForm.classList.toggle('hidden', target !== 'signin');
            registerForm.classList.toggle('hidden', target !== 'register');
            successPanel.classList.add('hidden');
        });
    });

    // Form submissions (demo — stored locally for now)
    signinForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = signinForm.querySelector('input[type="email"]').value;
        const name  = email.split('@')[0];
        const user  = { name, email, createdAt: Date.now() };
        localStorage.setItem('cartheon_user', JSON.stringify(user));
        addCustomerRecord(user);
        showSuccess(name);
    });
    registerForm.addEventListener('submit', e => {
        e.preventDefault();
        const firstName = registerForm.querySelector('input[type="text"]').value;
        const email     = registerForm.querySelector('input[type="email"]').value;
        const user      = { name: firstName, email, createdAt: Date.now() };
        localStorage.setItem('cartheon_user', JSON.stringify(user));
        addCustomerRecord(user);
        showSuccess(firstName);
    });

    function addCustomerRecord(user) {
        let list = [];
        try { list = JSON.parse(localStorage.getItem('cartheon_users')) || []; } catch {}
        if (!list.some(u => u.email === user.email)) {
            list.push(user);
            localStorage.setItem('cartheon_users', JSON.stringify(list));
        }
    }
    $('#forgot-link').addEventListener('click', e => {
        e.preventDefault();
        alert("We'll implement password recovery once we're connected to a backend. For now, just register a new account.");
    });

    function showSuccess(name) {
        signinForm.classList.add('hidden');
        registerForm.classList.add('hidden');
        successPanel.classList.remove('hidden');
        userNameSpan.textContent = name || 'friend';
        updateAccountBadge();
    }
    function refreshAccountView() {
        const stored = getStoredUser();
        if (stored) {
            signinForm.classList.add('hidden');
            registerForm.classList.add('hidden');
            successPanel.classList.remove('hidden');
            userNameSpan.textContent = stored.name || 'friend';
        } else {
            successPanel.classList.add('hidden');
            signinForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'signin'));
        }
    }
    function getStoredUser() {
        try { return JSON.parse(localStorage.getItem('cartheon_user')); }
        catch { return null; }
    }
    function updateAccountBadge() {
        const user = getStoredUser();
        accountTrigger.textContent = user ? `HI, ${user.name.toUpperCase()}` : 'ACCOUNT';
    }
    updateAccountBadge();

    /* =========================================================
       CART / BAG
       ========================================================= */
    const cartDrawer   = $('#cart-drawer');
    const cartTrigger  = $('#nav-bag');
    const cartClose    = $('#cart-close');
    const cartBackdrop = $('#cart-backdrop');
    const cartItemsEl  = $('#cart-items');
    const cartFooter   = $('#cart-footer');
    const cartSubtotal = $('#cart-subtotal');
    const bagCountEl   = $('#bag-count');
    const checkoutBtn  = $('#checkout-btn');

    const CART_KEY = 'cartheon_cart';
    let cart = loadCart();

    function loadCart() {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
        catch { return []; }
    }
    function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

    const openCart  = () => {
        cartDrawer.classList.add('open');
        cartDrawer.setAttribute('aria-hidden', 'false');
        lockScroll();
    };
    const closeCart = () => {
        cartDrawer.classList.remove('open');
        cartDrawer.setAttribute('aria-hidden', 'true');
        unlockScroll();
    };

    cartTrigger.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
    cartClose.addEventListener('click', closeCart);
    cartBackdrop.addEventListener('click', closeCart);

    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) return;
        // Navigate to the proper checkout page — cart is already in localStorage.
        window.location.href = 'checkout.html';
    });

    // Add to bag
    $$('.product-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.product-card');
            addToCart({
                id:       card.dataset.id,
                name:     card.dataset.name,
                price:    parseFloat(card.dataset.price),
                category: card.dataset.category,
                placeholder: card.querySelector('.product-placeholder')?.textContent || '◯',
                imageStyle:  card.querySelector('.product-image').getAttribute('style') || ''
            });
            btn.textContent = '✓ ADDED';
            btn.classList.add('added');
            setTimeout(() => {
                btn.textContent = 'ADD TO BAG';
                btn.classList.remove('added');
            }, 1400);
        });
    });

    /* ============ Clickable product cards + wishlist heart ============ */
    // Inject a heart button into every product card (not in the admin's rendering loop).
    function injectProductHearts() {
        const CP = window.CartheonProducts;
        if (!CP) return;
        $$('.product-card').forEach(card => {
            if (card.querySelector('.product-heart')) return;
            const id = card.dataset.id;
            if (!id) return;
            const imgWrap = card.querySelector('.product-image');
            if (!imgWrap) return;
            const heart = document.createElement('button');
            heart.type = 'button';
            heart.className = 'product-heart';
            const wished = CP.isWishlisted(id);
            heart.classList.toggle('is-active', wished);
            heart.innerHTML = wished ? '♥' : '♡';
            heart.setAttribute('aria-label', wished ? 'Remove from wishlist' : 'Add to wishlist');
            heart.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                CP.toggleWishlist(id);
                const now = CP.isWishlisted(id);
                heart.classList.toggle('is-active', now);
                heart.innerHTML = now ? '♥' : '♡';
                heart.setAttribute('aria-label', now ? 'Remove from wishlist' : 'Add to wishlist');
            });
            imgWrap.appendChild(heart);
        });
    }
    injectProductHearts();
    window.addEventListener('wishlist:change', injectProductHearts);

    // Clickable cards — whole card except the ADD button + heart navigates to PDP
    $$('.product-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            // Ignore clicks on interactive children
            if (e.target.closest('.product-add') || e.target.closest('.product-heart')) return;
            const id = card.dataset.id;
            if (id) window.location.href = 'product.html?id=' + encodeURIComponent(id);
        });
    });

    /* ============ Recently Viewed on home ============ */
    (function renderRecentlyViewed() {
        const CP = window.CartheonProducts;
        if (!CP) return;
        const host = document.getElementById('recently-viewed-grid');
        if (!host) return;
        const items = CP.recentlyViewed();
        const section = host.closest('section');
        if (!items.length) { if (section) section.style.display = 'none'; return; }
        if (section) section.style.display = '';
        host.innerHTML = items.slice(0, 4).map(p => `
            <a class="rv-card" href="product.html?id=${encodeURIComponent(p.id)}">
                <div class="rv-thumb" style="${p.image ? `background: url('${encodeURI(p.image)}') center/cover no-repeat;` : (p.gradient ? 'background:'+p.gradient+';' : '')}">
                    ${!p.image ? `<span>${(p.symbol || '◯').replace(/[<>&]/g,'')}</span>` : ''}
                </div>
                <div class="rv-meta">
                    <div class="rv-cat">${(p.category || '').replace(/[<>&]/g,'')}</div>
                    <h4>${(p.name || '').replace(/[<>&]/g,'')}</h4>
                    <div class="rv-price">€${Number(p.price).toFixed(2)}</div>
                </div>
            </a>`).join('');
    })();

    function addToCart(product) {
        const existing = cart.find(i => i.id === product.id);
        if (existing) existing.qty += 1;
        else cart.push({ ...product, qty: 1 });
        saveCart();
        renderCart();
        openCart();
    }

    function removeFromCart(id) {
        cart = cart.filter(i => i.id !== id);
        saveCart();
        renderCart();
    }

    function changeQty(id, delta) {
        const item = cart.find(i => i.id === id);
        if (!item) return;
        item.qty += delta;
        if (item.qty < 1) { removeFromCart(id); return; }
        saveCart();
        renderCart();
    }

    function renderCart() {
        const count = cart.reduce((s, i) => s + i.qty, 0);
        bagCountEl.textContent = count;

        if (cart.length === 0) {
            cartItemsEl.innerHTML = `
                <div class="cart-empty-state">
                    <p class="cart-empty">Your bag is empty.</p>
                    <button type="button" class="btn-outline cart-continue" id="cart-continue">CONTINUE SHOPPING</button>
                </div>`;
            cartFooter.style.display = 'none';
            return;
        }

        cartItemsEl.innerHTML = cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image" style="${item.imageStyle}">${item.placeholder}</div>
                <div class="cart-item-info">
                    <h4>${escapeHtml(item.name)}</h4>
                    <p>${escapeHtml(item.category)}</p>
                    <p class="cart-item-price">€${item.price.toFixed(2)}</p>
                    <div class="cart-item-qty">
                        <button class="cart-qty-btn" data-action="dec">−</button>
                        <span>${item.qty}</span>
                        <button class="cart-qty-btn" data-action="inc">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-action="remove">Remove</button>
            </div>
        `).join('');

        const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
        cartSubtotal.textContent = `€${subtotal.toFixed(2)}`;
        cartFooter.style.display = 'block';

        $$('.cart-item', cartItemsEl).forEach(row => {
            const id = row.dataset.id;
            row.querySelector('[data-action="inc"]').addEventListener('click', () => changeQty(id, +1));
            row.querySelector('[data-action="dec"]').addEventListener('click', () => changeQty(id, -1));
            row.querySelector('[data-action="remove"]').addEventListener('click', () => removeFromCart(id));
        });
    }
    renderCart();

    /* =========================================================
       GLOBAL KEYBOARD (ESC closes any overlay)
       ========================================================= */
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (searchOverlay.classList.contains('open'))  closeSearch();
        if (accountOverlay.classList.contains('open')) closeAccount();
        if (cartDrawer.classList.contains('open'))     closeCart();
        if (mobileMenu && mobileMenu.classList.contains('is-open')) closeMobileMenu();
    });

    /* =========================================================
       MOBILE HAMBURGER MENU
       ========================================================= */
    const hamburger  = $('#nav-hamburger');
    const mobileMenu = $('#mobile-menu');
    const openMobileMenu = () => {
        if (!mobileMenu) return;
        mobileMenu.classList.add('is-open');
        mobileMenu.setAttribute('aria-hidden', 'false');
        hamburger.setAttribute('aria-expanded', 'true');
        hamburger.setAttribute('aria-label', 'Close menu');
    };
    const closeMobileMenu = () => {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('is-open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Open menu');
    };
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            if (mobileMenu.classList.contains('is-open')) closeMobileMenu();
            else openMobileMenu();
        });
        // Close on link click
        $$('.mobile-menu-link', mobileMenu).forEach(a => {
            a.addEventListener('click', () => closeMobileMenu());
        });
    }

    /* =========================================================
       STICKY NAV SHADOW + PAGE PROGRESS BAR
       ========================================================= */
    const navbar      = $('#navbar');
    const progressBar = $('#page-progress');
    function onScroll() {
        const y = window.scrollY;
        if (navbar) navbar.classList.toggle('is-scrolled', y > 40);
        if (progressBar) {
            const doc = document.documentElement;
            const total = (doc.scrollHeight - doc.clientHeight) || 1;
            progressBar.style.width = Math.min(100, (y / total) * 100) + '%';
        }
        if (backToTopBtn) {
            backToTopBtn.classList.toggle('is-visible', y > window.innerHeight * 0.6);
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* =========================================================
       HERO REVEAL
       ========================================================= */
    const heroContent = $('.hero-content.reveal');
    if (heroContent) {
        requestAnimationFrame(() => {
            setTimeout(() => heroContent.classList.add('is-visible'), 80);
        });
    }

    /* =========================================================
       BACK-TO-TOP BUTTON
       ========================================================= */
    const backToTopBtn = $('#back-to-top');
    if (backToTopBtn) {
        backToTopBtn.removeAttribute('hidden');
        backToTopBtn.classList.add('is-mounted');
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* =========================================================
       STORAGE DETECTION
       ========================================================= */
    const storageBanner = $('#storage-banner');
    function storageOk() {
        try {
            const k = '__cartheon_storage_check__';
            localStorage.setItem(k, '1');
            localStorage.removeItem(k);
            return true;
        } catch { return false; }
    }
    if (storageBanner && !storageOk() && !sessionStorage.getItem('cartheon_storage_dismissed')) {
        storageBanner.hidden = false;
        const closeBtn = storageBanner.querySelector('.storage-banner-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                storageBanner.hidden = true;
                try { sessionStorage.setItem('cartheon_storage_dismissed', '1'); } catch {}
            });
        }
    }

    /* =========================================================
       NEWSLETTER — premium confirmation with promo code
       ========================================================= */
    const newsletterForm = $('#newsletter-form');
    const newsletterMsg  = $('#newsletter-msg');
    if (newsletterForm && newsletterMsg) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = newsletterForm.querySelector('input[type="email"]');
            const email = (input?.value || '').trim();
            if (!email) return;

            // Persist for admin panel visibility
            try {
                let list = [];
                try { list = JSON.parse(localStorage.getItem('cartheon_newsletter')) || []; } catch {}
                if (!list.some(x => (x.email || x) === email)) {
                    list.push({ email, joinedAt: Date.now() });
                    localStorage.setItem('cartheon_newsletter', JSON.stringify(list));
                }
            } catch {}

            newsletterMsg.innerHTML = `
                <p class="confirm-heading">Welcome to the CARTHEON circle.</p>
                <p class="confirm-body">We'll reach <strong>${escapeHtml(email)}</strong> first when new pieces drop.<br>
                Use this code for 10% off your first order:</p>
                <span class="confirm-code" title="Click to copy">CARTHEON10</span>
            `;
            newsletterMsg.classList.add('is-visible');
            input.value = '';

            // Click-to-copy promo code
            const codeEl = newsletterMsg.querySelector('.confirm-code');
            if (codeEl) {
                codeEl.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText('CARTHEON10');
                        const original = codeEl.textContent;
                        codeEl.textContent = 'COPIED ✓';
                        setTimeout(() => { codeEl.textContent = original; }, 1500);
                    } catch {}
                });
            }
        });
    }

    /* =========================================================
       CART — continue shopping button inside empty state
       ========================================================= */
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#cart-continue');
        if (btn) closeCart();
    });

    /* =========================================================
       FLY-TO-BAG micro-animation
       ========================================================= */
    function flyToBag(card) {
        try {
            const img = card.querySelector('.product-image');
            const bagEl = $('#nav-bag');
            if (!img || !bagEl) return;
            const imgRect = img.getBoundingClientRect();
            const bagRect = bagEl.getBoundingClientRect();
            const clone = document.createElement('div');
            clone.className = 'fly-to-bag';
            const placeholder = card.querySelector('.product-placeholder');
            clone.textContent = placeholder ? placeholder.textContent : '◯';
            const bgStyle = img.getAttribute('style') || '';
            if (bgStyle) clone.setAttribute('style', bgStyle);
            clone.style.position = 'fixed';
            clone.style.left = imgRect.left + imgRect.width / 2 - 26 + 'px';
            clone.style.top  = imgRect.top  + imgRect.height / 2 - 26 + 'px';
            clone.style.width = '52px';
            clone.style.height = '52px';
            clone.style.borderRadius = '50%';
            clone.style.opacity = '1';
            document.body.appendChild(clone);
            requestAnimationFrame(() => {
                const dx = (bagRect.left + bagRect.width / 2) - (imgRect.left + imgRect.width / 2);
                const dy = (bagRect.top + bagRect.height / 2) - (imgRect.top + imgRect.height / 2);
                clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.2)`;
                clone.style.opacity = '0';
            });
            setTimeout(() => clone.remove(), 800);
        } catch {}
    }
    // Hook into add-to-bag buttons (non-destructive — runs alongside existing handler)
    $$('.product-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = btn.closest('.product-card');
            if (card) flyToBag(card);
        });
    });

    // Trigger initial scroll handler
    onScroll();

    /* ---------- utilities ---------- */
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
});
