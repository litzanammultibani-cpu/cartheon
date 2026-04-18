/* ============================================================
   CARTHEON — Dark/Light theme toggle
   - Adds a button into every .nav-right
   - Persists preference in localStorage (cartheon_theme)
   - Falls back to prefers-color-scheme on first visit
   - Applies theme as early as possible via inline <script> in <head>
     (fallback: applied here on DOMContentLoaded — brief flash possible)
   ============================================================ */
(function () {
    'use strict';
    if (window.__cartheonThemeLoaded) return;
    window.__cartheonThemeLoaded = true;

    const KEY = 'cartheon_theme';

    function getTheme() {
        const stored = localStorage.getItem(KEY);
        if (stored === 'dark' || stored === 'light') return stored;
        // First visit — respect OS preference
        return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
            ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem(KEY, theme); } catch (e) {}
        updateButton(theme);
    }

    function currentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    function updateButton(theme) {
        document.querySelectorAll('.theme-toggle').forEach(btn => {
            btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
            btn.setAttribute('title', theme === 'dark' ? 'Light mode' : 'Dark mode');
            btn.textContent = theme === 'dark' ? '☀' : '☾';
        });
    }

    function injectButton() {
        // Inject a toggle into every .nav-right that doesn't already have one
        document.querySelectorAll('.nav-right').forEach(nav => {
            if (nav.querySelector('.theme-toggle')) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'theme-toggle';
            btn.setAttribute('aria-label', 'Toggle dark theme');
            btn.textContent = '☾';
            btn.addEventListener('click', () => {
                applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
            });
            nav.appendChild(btn);
        });
        updateButton(currentTheme());
    }

    // Apply theme immediately so layout is correct before full DOM ready
    applyTheme(getTheme());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectButton);
    } else {
        injectButton();
    }

    // Re-sync if OS preference changes and user hasn't set one explicitly
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(KEY)) applyTheme(e.matches ? 'dark' : 'light');
        });
    }
})();
