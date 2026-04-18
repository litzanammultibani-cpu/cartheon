/* ============================================================
   CARTHEON — Shared product catalog + wishlist + recently-viewed
   ----------------------------------------------------------------
   Provides a merged catalog (hardcoded defaults ∪ admin overrides
   from localStorage `cartheon_products`), wishlist helpers backed
   by `cartheon_wishlist`, and recently-viewed helpers backed by
   sessionStorage `cartheon_recent`.
   ============================================================ */
(function () {
    'use strict';
    if (window.CartheonProducts) return;

    // Default catalog — mirrors index.html static cards
    const DEFAULT_CATALOG = [
        {
            id: 'celeste-chain', name: 'Céleste Chain Bracelet', price: 34.00,
            category: 'Sterling Silver', symbol: '⌒', badge: 'NEW',
            description: 'A delicate, everyday chain bracelet in 925 sterling silver. Cable-link weave, box clasp, finished by hand in Strasbourg.',
            details: { material: '925 Sterling Silver', length: '16 cm + 3 cm extender', weight: '2.1 g', finish: 'Hand-polished' },
            gradient: 'linear-gradient(135deg, #f5f5f5 0%, #d0d0d0 100%)'
        },
        {
            id: 'infiniti-cuff', name: 'Infiniti Cuff', price: 42.00,
            category: '925 Silver', symbol: '∞',
            description: 'A sculpted infinity cuff in 925 silver — open, adjustable, and engineered to sit cleanly on the wrist.',
            details: { material: '925 Sterling Silver', length: 'Adjustable 15–18 cm', weight: '8.3 g', finish: 'Mirror polish' },
            gradient: 'linear-gradient(135deg, #eeeeee 0%, #b0b0b0 100%)'
        },
        {
            id: 'aurora-bangle', name: 'Aurora Bangle', price: 28.00,
            category: 'Polished Silver', symbol: '○', badge: 'BESTSELLER',
            description: 'Mirror-polished bangle with a seamless closure. Slim, round, and a CARTHEON bestseller.',
            details: { material: '925 Sterling Silver', diameter: '62 mm', weight: '6.7 g', finish: 'High polish' },
            gradient: 'linear-gradient(135deg, #f0f0f0 0%, #c4c4c4 100%)'
        },
        {
            id: 'etoile-charm', name: 'Étoile Charm Bracelet', price: 38.00,
            category: 'Sterling Silver', symbol: '✦',
            description: 'A cast silver star charm on a fine chain. Understated sparkle, perfect for stacking.',
            details: { material: '925 Sterling Silver', length: '16 cm + 3 cm extender', weight: '2.8 g', finish: 'Satin + polished charm' },
            gradient: 'linear-gradient(135deg, #e5e5e5 0%, #a5a5a5 100%)'
        },
        {
            id: 'lune-tennis', name: 'Lune Tennis Bracelet', price: 52.00,
            category: '925 Silver · Zirconia', symbol: '◐',
            description: 'Classic tennis bracelet set with brilliant-cut cubic zirconia on 925 silver. The statement piece of the line.',
            details: { material: '925 Sterling Silver', length: '18 cm', stones: 'Cubic zirconia, 2 mm', weight: '9.4 g' },
            gradient: 'linear-gradient(135deg, #ececec 0%, #b8b8b8 100%)'
        },
        {
            id: 'mira-paperclip', name: 'Mira Paperclip Chain', price: 36.00,
            category: 'Sterling Silver', symbol: '◇', badge: 'NEW',
            description: 'Modern elongated-link chain — bold without being heavy. Unisex and designed to layer.',
            details: { material: '925 Sterling Silver', length: '17 cm', weight: '4.1 g', finish: 'Polished' },
            gradient: 'linear-gradient(135deg, #f2f2f2 0%, #c8c8c8 100%)'
        },
        {
            id: 'solis-beaded', name: 'Sólis Beaded Bracelet', price: 26.00,
            category: 'Silver Beads', symbol: '◉',
            description: 'Hand-strung silver beads on an elastic cord. The casual piece — wear it alone or stack it.',
            details: { material: '925 Silver beads, elastic cord', circumference: 'Stretch, fits 15–19 cm', weight: '5.2 g' },
            gradient: 'linear-gradient(135deg, #e8e8e8 0%, #b5b5b5 100%)'
        },
        {
            id: 'sienna-heart', name: 'Sienna Heart Bracelet', price: 32.00,
            category: 'Polished Silver', symbol: '❉',
            description: 'A small polished heart pendant on a fine chain. Our go-to romance gift.',
            details: { material: '925 Sterling Silver', length: '16 cm + 3 cm extender', weight: '2.4 g' },
            gradient: 'linear-gradient(135deg, #efefef 0%, #c0c0c0 100%)'
        }
    ];

    const K_PRODUCTS = 'cartheon_products';
    const K_WISHLIST = 'cartheon_wishlist';
    const K_RECENT   = 'cartheon_recent';

    function loadLS(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch (e) { return fallback; }
    }
    function loadSS(key, fallback) {
        try { return JSON.parse(sessionStorage.getItem(key)) ?? fallback; }
        catch (e) { return fallback; }
    }
    function saveLS(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
    function saveSS(key, val) { sessionStorage.setItem(key, JSON.stringify(val)); }

    /**
     * Returns the merged catalog: admin overrides/additions merged on top
     * of DEFAULT_CATALOG. Admin can override individual fields per SKU.
     */
    function getCatalog() {
        const overrides = loadLS(K_PRODUCTS, null);
        if (!Array.isArray(overrides) || !overrides.length) return DEFAULT_CATALOG.slice();

        const byId = Object.fromEntries(DEFAULT_CATALOG.map(p => [p.id, { ...p }]));
        overrides.forEach(p => {
            if (!p || !p.id) return;
            byId[p.id] = { ...(byId[p.id] || {}), ...p, price: Number(p.price) || 0 };
        });
        return Object.values(byId);
    }

    function getProduct(id) {
        if (!id) return null;
        return getCatalog().find(p => p.id === id) || null;
    }

    function getRelated(id, count) {
        count = count || 3;
        const me = getProduct(id);
        if (!me) return [];
        const all = getCatalog().filter(p => p.id !== id);
        // Same-category first, then fill with others
        const same = all.filter(p => p.category === me.category);
        const others = all.filter(p => p.category !== me.category);
        return same.concat(others).slice(0, count);
    }

    // ======= WISHLIST (localStorage) =======
    function getWishlist() {
        const raw = loadLS(K_WISHLIST, []);
        return Array.isArray(raw) ? raw.filter(Boolean) : [];
    }
    function isWishlisted(id) { return getWishlist().includes(id); }
    function addToWishlist(id) {
        const list = getWishlist();
        if (!list.includes(id)) { list.push(id); saveLS(K_WISHLIST, list); emit('wishlist:change'); }
        return list;
    }
    function removeFromWishlist(id) {
        const list = getWishlist().filter(x => x !== id);
        saveLS(K_WISHLIST, list); emit('wishlist:change');
        return list;
    }
    function toggleWishlist(id) {
        return isWishlisted(id) ? removeFromWishlist(id) : addToWishlist(id);
    }
    function wishlistCount() { return getWishlist().length; }

    // ======= RECENTLY VIEWED (sessionStorage) =======
    function markViewed(id) {
        if (!id) return;
        const list = loadSS(K_RECENT, []);
        const without = list.filter(x => x !== id);
        without.unshift(id);
        const capped = without.slice(0, 6);
        saveSS(K_RECENT, capped);
    }
    function recentlyViewed(excludeId) {
        const ids = loadSS(K_RECENT, []);
        return ids
            .filter(x => !excludeId || x !== excludeId)
            .map(getProduct)
            .filter(Boolean);
    }

    // ======= EVENTS =======
    function emit(name) {
        try { window.dispatchEvent(new CustomEvent(name)); } catch (e) {}
    }

    // ======= BADGE (nav wishlist count) =======
    function paintWishlistBadge() {
        const n = wishlistCount();
        document.querySelectorAll('[data-wishlist-count]').forEach(el => {
            el.textContent = n > 0 ? n : '';
            el.style.display = n > 0 ? '' : 'none';
        });
    }
    window.addEventListener('wishlist:change', paintWishlistBadge);
    window.addEventListener('storage', e => {
        if (e.key === K_WISHLIST) paintWishlistBadge();
    });
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', paintWishlistBadge);
    } else {
        paintWishlistBadge();
    }

    // ======= PUBLIC API =======
    window.CartheonProducts = {
        getCatalog, getProduct, getRelated,
        getWishlist, isWishlisted, addToWishlist, removeFromWishlist,
        toggleWishlist, wishlistCount,
        markViewed, recentlyViewed,
        paintWishlistBadge
    };
})();
