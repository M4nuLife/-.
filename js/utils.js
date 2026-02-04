(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[ch]);

  const normText = (value) =>
    String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

  const debounce = (fn, wait = 150) => {
    let t = 0;
    return (...args) => {
      window.clearTimeout(t);
      t = window.setTimeout(() => fn(...args), wait);
    };
  };

  window.Manul = window.Manul || {};
  window.Manul.utils = { $, $$, escapeHtml, normText, debounce };
})();