(() => {
  'use strict';

  const CACHE = { data: null, promise: null };

  function getByPath(obj, path) {
    if (!path) return undefined;
    const parts = String(path).split('.').filter(Boolean);
    let cur = obj;

    for (const p of parts) {
      if (cur == null) return undefined;
      const idx = /^[0-9]+$/.test(p) ? Number(p) : null;
      cur = idx !== null ? cur[idx] : cur[p];
    }
    return cur;
  }

  async function load(path = './data/site.json') {
    if (CACHE.data) return CACHE.data;
    if (CACHE.promise) return CACHE.promise;

    CACHE.promise = fetch(path, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('CMS: failed to load ' + path);
        return r.json();
      })
      .then((json) => {
        CACHE.data = json;
        return json;
      })
      .catch((e) => {
        console.warn(e);
        CACHE.data = null;
        return null;
      });

    return CACHE.promise;
  }

  function apply(root, data) {
    if (!data) return;
    const scope = root || document;

    scope.querySelectorAll('[data-cms-text]').forEach((el) => {
      const key = el.getAttribute('data-cms-text');
      const val = getByPath(data, key);
      if (val === undefined || val === null) return;

      // Don't wipe nested controls (e.g., label + input). In such cases
      // the text should update only the visual caption (usually a <span>).
      if (el.querySelector('input, textarea, select')) {
        const caption = el.querySelector('span');
        if (caption) caption.textContent = String(val);
        else el.setAttribute('aria-label', String(val));
        return;
      }

      el.textContent = String(val);
    });

    scope.querySelectorAll('[data-cms-html]').forEach((el) => {
      const key = el.getAttribute('data-cms-html');
      const val = getByPath(data, key);
      if (val === undefined || val === null) return;
      el.innerHTML = String(val);
    });

    scope.querySelectorAll('[data-cms-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-cms-placeholder');
      const val = getByPath(data, key);
      if (val === undefined || val === null) return;
      el.setAttribute('placeholder', String(val));
    });

  }

  window.CMS = { load, apply, get: getByPath };
})();