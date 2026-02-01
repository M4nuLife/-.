document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  /* ===== Map init ===== */

  const map = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView([49.5, 95], 4);

  L.control
    .attribution({ prefix: false })
    .addAttribution('&copy; OpenStreetMap contributors')
    .addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);

  map.scrollWheelZoom.disable();
  map.doubleClickZoom.disable();

  const container = map.getContainer();
  container.addEventListener('click', () => map.scrollWheelZoom.enable());
  container.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());

  /* ===== Layers ===== */

  const layers = {
    zoos: L.layerGroup().addTo(map),
    reserves: L.layerGroup().addTo(map),
    range: L.layerGroup().addTo(map)
  };

  /* ===== UI ===== */

  const $ = (id) => document.getElementById(id);

  const countZoosEl = $('countZoos');
  const countReservesEl = $('countReserves');
  const fitAllBtn = $('fitAll');

  const searchInput = $('mapSearchInput');
  const searchList = $('mapSearchList');
  const searchClear = $('mapSearchClear');
  const searchTotal = $('mapSearchTotal');

  /* ===== Helpers ===== */

  const safe = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c])
    );

  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

  async function loadJSON(relPath) {
    const url = new URL(relPath, window.location.href).toString();
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }

    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Bad JSON in ${url}. First 120 chars: ${text.slice(0, 120)}`);
    }
  }

  /* ===== Data ===== */

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

  /* ===== Icons ===== */

  const zooIcon = L.divIcon({
    className: 'zoo-marker',
    html: '🐾',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  const reserveIcon = L.divIcon({
    className: 'reserve-marker',
    html: '🌿',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  /* ===== Render ===== */

  const zooMarkers = [];
  const reserveMarkers = [];

  zoos.forEach((p) => {
    const m = L.marker([p.lat, p.lng], { icon: zooIcon })
      .bindPopup(
        `<b>${safe(p.name)}</b><br>
         <small>${safe(p.country)}${p.region ? `, ${safe(p.region)}` : ''}</small><br>
         <small><b>Тип:</b> зоопарк</small>`
      )
      .addTo(layers.zoos);

    zooMarkers.push({ ...p, type: 'zoo', marker: m });
  });

  reserves.forEach((p) => {
    const m = L.marker([p.lat, p.lng], { icon: reserveIcon })
      .bindPopup(
        `<b>${safe(p.name)}</b><br>
         <small>${safe(p.country)}${p.region ? `, ${safe(p.region)}` : ''}</small><br>
         <small><b>Тип:</b> ООПТ / заповедник</small>`
      )
      .addTo(layers.reserves);

    reserveMarkers.push({ ...p, type: 'reserve', marker: m });
  });

  (range.polygons || []).forEach((p) => {
    L.polygon(p.coords, {
      color: '#f39c12',
      weight: 2,
      dashArray: '7 7',
      fillOpacity: 0.08
    })
      .bindPopup(`<b>${safe(p.name || 'Ареал манула')}</b>`)
      .addTo(layers.range);
  });

  if (countZoosEl) countZoosEl.textContent = String(zoos.length);
  if (countReservesEl) countReservesEl.textContent = String(reserves.length);

  /* ===== Chips ===== */

  const chips = Array.from(document.querySelectorAll('.chip[data-layer]'));

  const setChipState = (layerName, enable) => {
    const chip = document.querySelector(`.chip[data-layer="${layerName}"]`);
    if (!chip) return;
    chip.classList.toggle('is-active', enable);
  };

  const enableLayer = (name) => {
    layers[name].addTo(map);
    setChipState(name, true);
  };

  const disableLayer = (name) => {
    map.removeLayer(layers[name]);
    setChipState(name, false);
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const name = chip.dataset.layer;
      const enable = !chip.classList.contains('is-active');
      chip.classList.toggle('is-active', enable);
      enable ? layers[name].addTo(map) : map.removeLayer(layers[name]);
    });
  });

  /* ===== Fit / Toggle all ===== */

  const calcBoundsAll = () => {
    const bounds = L.latLngBounds([]);

    layers.range.eachLayer((l) => {
      if (l.getBounds) bounds.extend(l.getBounds());
    });

    layers.reserves.eachLayer((l) => {
      if (l.getLatLng) bounds.extend(l.getLatLng());
      else if (l.getBounds) bounds.extend(l.getBounds());
    });

    layers.zoos.eachLayer((l) => {
      if (l.getLatLng) bounds.extend(l.getLatLng());
      else if (l.getBounds) bounds.extend(l.getBounds());
    });

    return bounds;
  };

  const showAll = () => {
    enableLayer('range');
    enableLayer('reserves');
    enableLayer('zoos');

    const bounds = calcBoundsAll();
    if (!bounds.isValid()) return;

    map.invalidateSize();
    map.fitBounds(bounds.pad(0.15));
  };

  const hideAll = () => {
    disableLayer('range');
    disableLayer('reserves');
    disableLayer('zoos');
    map.closePopup();
  };

  const isAllVisible = () =>
    ['range', 'reserves', 'zoos'].every((k) => map.hasLayer(layers[k]));

  fitAllBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAllVisible()) hideAll();
    else showAll();
  });

  // по умолчанию показать всё и отзумить
  showAll();

  /* ===== Legend ===== */

  const legend = L.control({ position: 'bottomleft' });

  legend.onAdd = () => {
    const div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = `
      <div class="map-legend__row">
        <span class="map-legend__icon zoo">🐾</span>
        <span>Зоопарки</span>
      </div>
      <div class="map-legend__row">
        <span class="map-legend__icon reserve">🌿</span>
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

  /* ===== Search ===== */

  const allItems = [...zooMarkers, ...reserveMarkers];
  if (searchTotal) searchTotal.textContent = String(allItems.length);

  const renderList = (items) => {
    if (!searchList) return;
    searchList.innerHTML = '';

    const limited = items.slice(0, 80);

    limited.forEach((it) => {
      const el = document.createElement('div');
      el.className = 'map-search__item';
      el.setAttribute('role', 'option');

      const badgeLayer = it.type === 'zoo' ? 'zoos' : 'reserves';
      const badgeText = it.type === 'zoo' ? 'Зоопарк' : 'ООПТ';
      const badgeClass = it.type === 'zoo' ? 'zoo' : 'reserve';

      el.innerHTML = `
        <div class="map-search__item-title">
          <span class="map-search__badge ${badgeClass}">${badgeText}</span>
          <span>${safe(it.name)}</span>
        </div>
        <div class="map-search__item-sub">
          ${safe(it.country)}${it.region ? `, ${safe(it.region)}` : ''}
        </div>
      `;

      el.addEventListener('click', () => {
        enableLayer(badgeLayer);

        map.setView([it.lat, it.lng], Math.max(map.getZoom(), 7), { animate: true });
        setTimeout(() => it.marker.openPopup(), 200);
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

  const filter = () => {
    const q = norm(searchInput?.value);
    if (!q) {
      renderList(allItems);
      return;
    }

    const filtered = allItems.filter((it) =>
      norm(`${it.name} ${it.country} ${it.region || ''}`).includes(q)
    );

    renderList(filtered);
  };

  searchInput?.addEventListener('input', filter);

  searchClear?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    renderList(allItems);
    searchInput?.focus();
  });

  renderList(allItems);
  setTimeout(() => map.invalidateSize(), 80);
});
