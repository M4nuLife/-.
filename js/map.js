(() => {
  'use strict';

  const Utils = (window.Manul && window.Manul.utils) || {};
  const escapeHtml =
    Utils.escapeHtml ||
    ((s) =>
      String(s ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[c])));

  const normText =
    Utils.normText ||
    ((s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim());

  const debounce =
    Utils.debounce ||
    ((fn, wait = 120) => {
      let t = 0;
      return (...args) => {
        window.clearTimeout(t);
        t = window.setTimeout(() => fn(...args), wait);
      };
    });

  const CONFIG = {
    center: [49.5, 95],
    zoom: 4,
    minZoom: 3,
    maxZoom: 19
  };

  const WORLD_BOUNDS = L.latLngBounds(
    L.latLng(-85, -180),
    L.latLng(85, 180)
  );

  const TILESETS = {
    dark: {
      id: 'dark',
      label: 'Тёмная',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    },
    light: {
      id: 'light',
      label: 'Светлая',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    },
    relief: {
      id: 'relief',
      label: 'Рельеф',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    }
  };

  const STORAGE = {
    theme: 'manul_map_theme',
    searchCollapsed: 'manul_map_search_collapsed',
    uiHidden: 'manul_map_ui_hidden'
  };

  const ids = {
    stage: 'mapStage',
    root: 'mapRoot',
    countZoos: 'countZoos',
    countReserves: 'countReserves',
    fitAll: 'fitAll',
    searchInput: 'mapSearchInput',
    searchList: 'mapSearchList',
    searchClear: 'mapSearchClear',
    searchTotal: 'mapSearchTotal',
    fullscreen: 'mapFullscreen',
    themeBtn: 'mapThemeBtn',
    themeMenu: 'mapThemeMenu',
    panelToggle: 'mapPanelToggle',
    panelRestore: 'mapPanelRestore',
    searchToggle: 'mapSearchToggle'
  };

  const byId = (id) => document.getElementById(id);

  async function loadJSON(relPath) {
    const url = new URL(relPath, window.location.href).toString();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Bad JSON in ${url}. First 120 chars: ${text.slice(0, 120)}`);
    }
  }

  function initLeafletMap() {
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: true,
      minZoom: CONFIG.minZoom,
      maxZoom: CONFIG.maxZoom,
      worldCopyJump: true,
      maxBounds: WORLD_BOUNDS,
      maxBoundsViscosity: 1.0
    }).setView(CONFIG.center, CONFIG.zoom);

    if (map.attributionControl) map.attributionControl.setPrefix(false);

    // avoid accidental page zoom/scroll fighting the map
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    const el = map.getContainer();
    el.addEventListener('click', () => map.scrollWheelZoom.enable());
    el.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());

    return map;
  }

  function createLayers(map) {
    return {
      zoos: L.layerGroup().addTo(map),
      reserves: L.layerGroup().addTo(map),
      range: L.layerGroup().addTo(map)
    };
  }

  function createIcons() {
    const common = { iconSize: [30, 30], iconAnchor: [15, 15] };
    return {
      zoo: L.divIcon({
        className: 'zoo-marker',
        html: '<span class="map-pin map-pin--zoo" aria-hidden="true"></span>',
        ...common
      }),
      reserve: L.divIcon({
        className: 'reserve-marker',
        html: '<span class="map-pin map-pin--reserve" aria-hidden="true"></span>',
        ...common
      })
    };
  }

  function renderPoints({ points, layer, icon, typeLabel, typeKey }) {
    const items = [];

    points.forEach((p) => {
      const marker = L.marker([p.lat, p.lng], { icon })
        .bindPopup(
          `<b>${escapeHtml(p.name)}</b><br>
           <small>${escapeHtml(p.country)}${p.region ? `, ${escapeHtml(p.region)}` : ''}</small><br>
           <small><b>Тип:</b> ${escapeHtml(typeLabel)}</small>`
        )
        .addTo(layer);

      items.push({ ...p, type: typeKey, marker });
    });

    return items;
  }

  function renderRangePolygons(range, layer) {
    (range?.polygons || []).forEach((p) => {
      // Soft glow underlay
      L.polygon(p.coords, {
        color: '#f39c12',
        weight: 12,
        opacity: 0.08,
        fillColor: '#f39c12',
        fillOpacity: 0.10
      }).addTo(layer);

      // Crisp dashed outline
      L.polygon(p.coords, {
        color: '#f39c12',
        weight: 2,
        opacity: 0.95,
        dashArray: '6 8',
        lineCap: 'round',
        lineJoin: 'round',
        fillColor: '#f39c12',
        fillOpacity: 0.14
      })
        .bindPopup(`<b>${escapeHtml(p.name || 'Ареал манула')}</b>`)
        .addTo(layer);
    });
  }

  function setChipState(layerName, enable) {
    const chip = document.querySelector(`.chip[data-layer="${layerName}"]`);
    chip?.classList.toggle('is-active', enable);
  }

  function enableLayer(map, layers, name) {
    layers[name].addTo(map);
    setChipState(name, true);
  }

  function disableLayer(map, layers, name) {
    map.removeLayer(layers[name]);
    setChipState(name, false);
  }

  function initChips(map, layers) {
    document.querySelectorAll('.chip[data-layer]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const name = chip.dataset.layer;
        const enable = !chip.classList.contains('is-active');
        chip.classList.toggle('is-active', enable);
        enable ? layers[name].addTo(map) : map.removeLayer(layers[name]);
      });
    });
  }

  function calcBoundsAll(layers) {
    const bounds = L.latLngBounds([]);

    const extend = (lg) => {
      lg.eachLayer((l) => {
        if (l.getLatLng) bounds.extend(l.getLatLng());
        else if (l.getBounds) bounds.extend(l.getBounds());
      });
    };

    extend(layers.range);
    extend(layers.reserves);
    extend(layers.zoos);

    return bounds;
  }

  function initFitAll(map, layers) {
    const btn = byId(ids.fitAll);

    const showAll = () => {
      enableLayer(map, layers, 'range');
      enableLayer(map, layers, 'reserves');
      enableLayer(map, layers, 'zoos');

      const bounds = calcBoundsAll(layers);
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.15));
    };

    const hideAll = () => {
      disableLayer(map, layers, 'range');
      disableLayer(map, layers, 'reserves');
      disableLayer(map, layers, 'zoos');
      map.closePopup();
    };

    const isAllVisible = () => ['range', 'reserves', 'zoos'].every((k) => map.hasLayer(layers[k]));

    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isAllVisible() ? hideAll() : showAll();
    });

    showAll();
  }

  function initLegend(map) {
    const legend = L.control({ position: 'bottomleft' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML = `
        <div class="map-legend__row">
          <span class="map-legend__pin" aria-hidden="true"><span class="map-pin map-pin--zoo"></span></span>
          <span>Зоопарки</span>
        </div>
        <div class="map-legend__row">
          <span class="map-legend__pin" aria-hidden="true"><span class="map-pin map-pin--reserve"></span></span>
          <span>Заповедники / ООПТ</span>
        </div>
        <div class="map-legend__row">
          <span class="map-legend__swatch"></span>
          <span>Ареал обитания</span>
        </div>
        <div class="map-legend__hint">Клик по карте → включить зум колесом</div>
      `;
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      return div;
    };

    legend.addTo(map);
  }

  function initSearch(map, layers, allItems) {
    const searchInput = byId(ids.searchInput);
    const searchList = byId(ids.searchList);
    const searchClear = byId(ids.searchClear);
    const searchTotal = byId(ids.searchTotal);

    if (searchTotal) searchTotal.textContent = String(allItems.length);

    const renderList = (items) => {
      if (!searchList) return;
      searchList.innerHTML = '';

      const limited = items.slice(0, 80);

      limited.forEach((it) => {
        const el = document.createElement('div');
        el.className = 'map-search__item';
        el.setAttribute('role', 'option');

        const layerName = it.type === 'zoo' ? 'zoos' : 'reserves';
        const badgeText = it.type === 'zoo' ? 'Зоопарк' : 'ООПТ';
        const badgeClass = it.type === 'zoo' ? 'zoo' : 'reserve';

        el.innerHTML = `
          <div class="map-search__item-title">
            <span class="map-search__badge ${badgeClass}">${badgeText}</span>
            <span>${escapeHtml(it.name)}</span>
          </div>
          <div class="map-search__item-sub">
            ${escapeHtml(it.country)}${it.region ? `, ${escapeHtml(it.region)}` : ''}
          </div>
        `;

        el.addEventListener('click', () => {
          enableLayer(map, layers, layerName);
          map.setView([it.lat, it.lng], Math.max(map.getZoom(), 7), { animate: true });
          window.setTimeout(() => it.marker.openPopup(), 200);
        });

        searchList.appendChild(el);
      });

      if (items.length > limited.length) {
        const more = document.createElement('div');
        more.className = 'map-search__hint';
        more.textContent = `Показано ${limited.length} из ${items.length}. Уточните запрос.`;
        searchList.appendChild(more);
      }
    };

    const doFilter = () => {
      const q = normText(searchInput?.value);
      if (!q) return renderList(allItems);

      const filtered = allItems.filter((it) =>
        normText(`${it.name} ${it.country} ${it.region || ''}`).includes(q)
      );

      renderList(filtered);
    };

    const filter = debounce(doFilter, 120);
    searchInput?.addEventListener('input', filter);

    searchClear?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      renderList(allItems);
      searchInput?.focus();
    });

    renderList(allItems);
  }

  function initUiControls(map) {
    const stage = byId(ids.stage);
    const root = byId(ids.root);
    if (!stage || !root) return;

    const fsBtn = byId(ids.fullscreen);
    const themeBtn = byId(ids.themeBtn);
    const themeMenu = byId(ids.themeMenu);
    const themeWrap = document.getElementById('mapThemeWrap');
    const panelToggleBtn = byId(ids.panelToggle);
    const panelRestoreBtn = byId(ids.panelRestore);
    const mapSearch = document.getElementById('mapSearch');
    const searchToggleBtn = byId(ids.searchToggle);

    // ===== Base layer (theme) =====

    const getSavedTheme = () => {
      const v = String(localStorage.getItem(STORAGE.theme) || '').toLowerCase();
      return TILESETS[v] ? v : 'dark';
    };

    let theme = getSavedTheme();
    let baseLayer = null;

    const setThemeUi = () => {
      if (!themeBtn) return;
      const label = TILESETS[theme]?.label || 'Тёмная';
      themeBtn.textContent = `Карта: ${label}`;

      if (themeMenu) {
        themeMenu.querySelectorAll('[data-theme]').forEach((btn) => {
          btn.classList.toggle('is-active', btn.dataset.theme === theme);
        });
      }
    };

    const applyTheme = (name) => {
      const next = TILESETS[name] ? name : 'dark';
      theme = next;
      localStorage.setItem(STORAGE.theme, theme);

      if (baseLayer) map.removeLayer(baseLayer);

      const t = TILESETS[theme];
      baseLayer = L.tileLayer(t.url, {
        maxZoom: t.maxZoom,
        attribution: t.attribution,
        noWrap: true
      });
      baseLayer.addTo(map);
      setThemeUi();
    };

    applyTheme(theme);

    const closeThemeMenu = () => {
      if (!themeMenu) return;
      themeMenu.hidden = true;
      themeWrap?.classList.remove('is-dropup');
    };

    const updateThemeMenuDirection = () => {
      if (!themeMenu || !themeWrap || themeMenu.hidden) return;
      // default: open down
      themeWrap.classList.remove('is-dropup');
      const rect = themeMenu.getBoundingClientRect();
      const overBottom = rect.bottom > window.innerHeight - 12;
      themeWrap.classList.toggle('is-dropup', overBottom);
    };

    const toggleThemeMenu = () => {
      if (!themeMenu) return;
      const willOpen = themeMenu.hidden;
      themeMenu.hidden = !themeMenu.hidden;

      if (themeBtn) themeBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');

      if (willOpen) {
        // allow layout to update before measuring
        window.requestAnimationFrame(updateThemeMenuDirection);
      } else {
        themeWrap?.classList.remove('is-dropup');
      }
    };

    themeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleThemeMenu();
    });

    window.addEventListener('resize', debounce(updateThemeMenuDirection, 80));

    themeMenu?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-theme]');
      if (!btn) return;
      applyTheme(btn.dataset.theme);
      closeThemeMenu();
    });

    document.addEventListener('click', (e) => {
      if (!themeMenu || themeMenu.hidden) return;
      const inside = e.target.closest('#' + ids.themeMenu) || e.target.closest('#' + ids.themeBtn);
      if (!inside) closeThemeMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeThemeMenu();
    });

    setThemeUi();

    // ===== Search collapse =====

    const setSearchCollapsed = (on) => {
      if (!mapSearch) return;
      mapSearch.classList.toggle('is-collapsed', on);
      localStorage.setItem(STORAGE.searchCollapsed, on ? '1' : '0');
      window.setTimeout(() => map.invalidateSize(), 120);
    };

    const isSearchCollapsed = () => {
      if (!mapSearch) return false;
      const saved = localStorage.getItem(STORAGE.searchCollapsed);
      return saved === '1' || mapSearch.classList.contains('is-collapsed');
    };

    if (mapSearch) {
      const saved = localStorage.getItem(STORAGE.searchCollapsed);
      if (saved === '1') mapSearch.classList.add('is-collapsed');
    }

    searchToggleBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setSearchCollapsed(!isSearchCollapsed());
    });

    // ===== UI hide / restore =====

    const setUiHidden = (on) => {
      stage.classList.toggle('is-ui-hidden', on);
      localStorage.setItem(STORAGE.uiHidden, on ? '1' : '0');
      window.setTimeout(() => map.invalidateSize(), 80);
    };

    const savedHidden = String(localStorage.getItem(STORAGE.uiHidden) || '') === '1';
    if (savedHidden) setUiHidden(true);

    panelToggleBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setUiHidden(!stage.classList.contains('is-ui-hidden'));
    });

    panelRestoreBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setUiHidden(false);
    });

    // ===== Fullscreen =====

    const setFsState = (on) => {
      stage.classList.toggle('is-fs', on);
      document.body.classList.toggle('is-map-fs', on);
      fsCtrlBtn?.classList.toggle('is-active', on);
      window.setTimeout(() => map.invalidateSize(), 140);
    };

    const inNativeFs = () => document.fullscreenElement === root;

    const toggleFullscreen = async (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();

      if (document.fullscreenEnabled) {
        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          } else {
            await root.requestFullscreen();
          }
          return;
        } catch (_) {
          // fall back to css fullscreen
        }
      }

      setFsState(!stage.classList.contains('is-fs'));
    };

    // Map control (top-right). Fullscreen button lives on the map, not in the panel.
    let fsCtrlBtn = null;
    const FsControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd() {
        const wrap = L.DomUtil.create('div', 'leaflet-control manul-mapctl');
        const btn = L.DomUtil.create('button', 'manul-mapctl__btn', wrap);
        btn.type = 'button';
        btn.title = 'Экран';
        btn.setAttribute('aria-label', 'Полноэкранный режим');
        btn.innerHTML = '⛶';
        fsCtrlBtn = btn;

        L.DomEvent.disableClickPropagation(wrap);
        L.DomEvent.on(btn, 'click', toggleFullscreen);
        return wrap;
      }
    });

    map.addControl(new FsControl());

    // (Optional) if a panel fullscreen button exists, keep it working too
    fsBtn?.addEventListener('click', toggleFullscreen);

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement && document.fullscreenElement !== root) return;
      setFsState(inNativeFs());
    });

    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!document.fullscreenElement) setFsState(false);
    });
  }

  async function init() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;

    const map = initLeafletMap();
    initUiControls(map);

    const layers = createLayers(map);

    let zoos = [];
    let reserves = [];
    let range = { polygons: [] };

    try {
      [zoos, reserves, range] = await Promise.all([
        loadJSON('data/zoos.json'),
        loadJSON('data/reserves.json'),
        loadJSON('data/range.json')
      ]);
    } catch (e) {
      alert('Не загрузились данные карты. Открой консоль (F12).');
      console.error(e);
      return;
    }

    const icons = createIcons();

    const zooMarkers = renderPoints({
      points: zoos,
      layer: layers.zoos,
      icon: icons.zoo,
      typeLabel: 'зоопарк',
      typeKey: 'zoo'
    });

    const reserveMarkers = renderPoints({
      points: reserves,
      layer: layers.reserves,
      icon: icons.reserve,
      typeLabel: 'ООПТ / заповедник',
      typeKey: 'reserve'
    });

    renderRangePolygons(range, layers.range);

    const countZoosEl = byId(ids.countZoos);
    const countReservesEl = byId(ids.countReserves);
    if (countZoosEl) countZoosEl.textContent = String(zoos.length);
    if (countReservesEl) countReservesEl.textContent = String(reserves.length);

    initChips(map, layers);
    initFitAll(map, layers);
    initLegend(map);
    initSearch(map, layers, [...zooMarkers, ...reserveMarkers]);

    window.setTimeout(() => map.invalidateSize(), 120);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
