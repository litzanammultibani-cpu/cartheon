(function () {
    'use strict';

    var STORAGE_KEY = 'cartheon_cookie_consent';

    function getConsent() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function saveConsent(consent) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
        } catch (e) { /* noop */ }
    }

    function buildBanner() {
        var banner = document.createElement('div');
        banner.className = 'cartheon-cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Cookie consent');
        banner.innerHTML =
            '<div class="cartheon-cookie-text">' +
                '<strong>We value your privacy</strong>' +
                'CARTHEON uses essential cookies to make the site work. With your consent, we also use analytics to understand how the site is used. ' +
                '<a href="cookies.html">Read our cookie policy</a>.' +
            '</div>' +
            '<div class="cartheon-cookie-actions">' +
                '<button type="button" class="cartheon-cookie-btn ghost" data-action="decline">DECLINE</button>' +
                '<button type="button" class="cartheon-cookie-btn secondary" data-action="customize">CUSTOMIZE</button>' +
                '<button type="button" class="cartheon-cookie-btn primary" data-action="accept">ACCEPT ALL</button>' +
            '</div>';
        document.body.appendChild(banner);
        return banner;
    }

    function buildModal() {
        var modal = document.createElement('div');
        modal.className = 'cartheon-cookie-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML =
            '<div class="cartheon-cookie-modal-inner">' +
                '<h2>Cookie preferences</h2>' +
                '<p class="cartheon-cookie-modal-sub">Choose which cookies you allow. You can change these preferences any time via the link in our footer.</p>' +
                '<div class="cartheon-cookie-category">' +
                    '<div class="cartheon-cookie-category-info">' +
                        '<h4>Essential</h4>' +
                        '<p>Required for the cart, account, and basic site function. Cannot be disabled.</p>' +
                    '</div>' +
                    '<label class="cartheon-cookie-toggle">' +
                        '<input type="checkbox" checked disabled>' +
                        '<span class="cartheon-cookie-toggle-slider"></span>' +
                    '</label>' +
                '</div>' +
                '<div class="cartheon-cookie-category">' +
                    '<div class="cartheon-cookie-category-info">' +
                        '<h4>Analytics</h4>' +
                        '<p>Help us understand how visitors use the site, so we can improve it. Anonymized.</p>' +
                    '</div>' +
                    '<label class="cartheon-cookie-toggle">' +
                        '<input type="checkbox" id="cartheon-toggle-analytics">' +
                        '<span class="cartheon-cookie-toggle-slider"></span>' +
                    '</label>' +
                '</div>' +
                '<div class="cartheon-cookie-modal-actions">' +
                    '<button type="button" class="cartheon-cookie-btn" data-action="modal-cancel">CANCEL</button>' +
                    '<button type="button" class="cartheon-cookie-btn primary" data-action="modal-save">SAVE PREFERENCES</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(modal);
        return modal;
    }

    function showBanner(banner) {
        requestAnimationFrame(function () {
            banner.classList.add('visible');
        });
    }

    function hideBanner(banner) {
        banner.classList.remove('visible');
        setTimeout(function () {
            if (banner.parentNode) banner.parentNode.removeChild(banner);
        }, 450);
    }

    function writeConsent(analytics) {
        var consent = {
            essential: true,
            analytics: !!analytics,
            timestamp: new Date().toISOString()
        };
        saveConsent(consent);
        return consent;
    }

    function initBannerLogic() {
        // Skip on admin pages
        var path = (window.location.pathname || '').toLowerCase();
        if (path.indexOf('admin') !== -1) return;

        var existing = getConsent();

        // Expose a method to re-open preferences (for footer "Manage cookies" link)
        window.cartheonCookieOpen = function () {
            openPreferences();
        };

        if (existing) {
            return; // Already consented — do not show
        }

        var banner = buildBanner();
        showBanner(banner);

        banner.addEventListener('click', function (e) {
            var action = e.target.getAttribute('data-action');
            if (!action) return;

            if (action === 'accept') {
                writeConsent(true);
                hideBanner(banner);
            } else if (action === 'decline') {
                writeConsent(false);
                hideBanner(banner);
            } else if (action === 'customize') {
                openPreferences(function () {
                    hideBanner(banner);
                });
            }
        });
    }

    function openPreferences(onSave) {
        var modal = buildModal();
        modal.classList.add('open');

        var current = getConsent() || { analytics: false };
        var toggle = modal.querySelector('#cartheon-toggle-analytics');
        if (toggle) toggle.checked = !!current.analytics;

        function close() {
            modal.classList.remove('open');
            setTimeout(function () {
                if (modal.parentNode) modal.parentNode.removeChild(modal);
            }, 200);
        }

        modal.addEventListener('click', function (e) {
            if (e.target === modal) close();
            var action = e.target.getAttribute('data-action');
            if (action === 'modal-cancel') {
                close();
            } else if (action === 'modal-save') {
                writeConsent(!!toggle.checked);
                close();
                if (typeof onSave === 'function') onSave();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBannerLogic);
    } else {
        initBannerLogic();
    }
})();
