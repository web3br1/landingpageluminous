#!/usr/bin/env node

const crypto = require("crypto");

const scriptContent = `
(function() {
  'use strict';

  // 1. Ensure data-theme is set (already done by SSR, but double-check)
  if (!document.documentElement.hasAttribute('data-theme')) {
    document.documentElement.setAttribute('data-theme', 'tech-blueprint');
  }

  // 2. Set system preferences (NOT controlled by React - prevents hydration mismatch)
  function updateSystemTheme() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-system-theme', isDark ? 'dark' : 'light');
  }

  function updateReducedMotion() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.setAttribute('data-reduced-motion', reduced ? 'true' : 'false');
  }

  if (window.matchMedia) {
    updateSystemTheme();
    updateReducedMotion();

    // Listen for changes (but don't update React-controlled attributes)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme);
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', updateReducedMotion);
  }

  // 3. Remove loading state after hydration to enable transitions
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        document.documentElement.removeAttribute('data-loading');
      }, 50);
    });
  } else {
    setTimeout(function() {
      document.documentElement.removeAttribute('data-loading');
    }, 50);
  }
})();
`;

const hash = crypto
  .createHash("sha256")
  .update(scriptContent.trim())
  .digest("base64");
console.log("SHA-256 hash:", hash);
console.log("CSP directive: sha256-" + hash);
