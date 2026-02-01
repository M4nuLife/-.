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
    String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  const norm = (s) =>
    String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

async function loadJSON(relPath) {
  const res = await fetch(relPath, { cache: "no-cache" });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${relPath}`);
  }

  return await res.json();
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

  if (countZoosEl) countZoosEl.textContent = zoos.length;
  if (countReservesEl) countReservesEl.textContent = reserves.length;

  /* ===== Chips ===== */

  document.querySelectorAll('.chip[data-layer]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const name = chip.dataset.layer;
      const active = !chip.classList.contains('is-active');
      chip.classList.toggle('is-active', active);
      active ? layers[name].addTo(map) : map.removeLayer(layers[name]);
    });
  });

  /* ===== Fit bounds ===== */

  const fitAll = () => {
    const bounds = L.latLngBounds([]);

    Object.values(layers).forEach((layer) => {
      layer.eachLayer((l) => {
        if (l.getBounds) bounds.extend(l.getBounds());
        else if (l.getLatLng) bounds.extend(l.getLatLng());
      });
    });

    bounds.isValid() && map.fitBounds(bounds.pad(0.15));
  };

  fitAllBtn?.addEventListener('click', fitAll);
  fitAll();

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
  if (searchTotal) searchTotal.textContent = allItems.length;

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
        layers[badgeLayer].addTo(map);
        document.querySelector(`.chip[data-layer="${badgeLayer}"]`)
          ?.classList.add('is-active');

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
    renderList(!q ? allItems : allItems.filter((it) =>
      norm(`${it.name} ${it.country} ${it.region || ''}`).includes(q)
    ));
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
