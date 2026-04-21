/* ============================================================
   VAIYN — Always-dark theme (light theme removed)
   The early-apply script in each page's <head> sets
   data-theme="dark" on <html> before paint. This file is
   kept as a no-op safety net so old <script src="theme.js">
   tags don't 404.
   ============================================================ */
(function () {
    'use strict';
    // Force dark, always — no toggle, no preference, no toggle button.
    document.documentElement.setAttribute('data-theme', 'dark');
    try { localStorage.setItem('vaiyn_theme', 'dark'); } catch (e) {}
})();
