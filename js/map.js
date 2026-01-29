document.addEventListener("DOMContentLoaded", () => {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  const map = L.map("map", {
  zoomControl: true,
  attributionControl: false
}).setView([46.5, 94.0], 4);

  
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  
map.scrollWheelZoom.disable();


map.getContainer().addEventListener("click", () => {
  map.scrollWheelZoom.enable();
});

map.getContainer().addEventListener("mouseleave", () => {
  map.scrollWheelZoom.disable();
});

  L.control.attribution({
  prefix: false
}).addAttribution('&copy; OpenStreetMap contributors')
  .addTo(map);

  const zoosData = [
    { name: "Зоопарк (Алматы)", lat: 43.2389, lng: 76.8897, note: "Учебная точка" },
    { name: "Зоопарк (Новосибирск)", lat: 55.0084, lng: 82.9357, note: "Учебная точка" }
  ];

  const reservesData = [
    { name: "Заповедник (Алтай)", lat: 50.1, lng: 86.3, note: "Учебная точка" },
    { name: "Заповедник (Монголия)", lat: 47.9, lng: 106.9, note: "Учебная точка" }
  ];

  const zoosLayer = L.layerGroup();
  zoosData.forEach((p) => {
    L.marker([p.lat, p.lng])
      .bindPopup(`<b>${p.name}</b><br><small>${p.note}</small>`)
      .addTo(zoosLayer);
  });

  const reservesLayer = L.layerGroup();
  reservesData.forEach((p) => {
    L.circleMarker([p.lat, p.lng], {
      radius: 7,
      color: "#f39c12",
      weight: 2,
      fillColor: "#f39c12",
      fillOpacity: 0.25
    })
      .bindPopup(`<b>${p.name}</b><br><small>${p.note}</small>`)
      .addTo(reservesLayer);
  });

  const rangeLayer = L.polygon(
    [
      [55, 65],
      [54, 95],
      [50, 110],
      [45, 118],
      [40, 112],
      [38, 95],
      [42, 75]
    ],
    {
      color: "#f39c12",
      weight: 2,
      fillColor: "#f39c12",
      fillOpacity: 0.12
    }
  );

  
  zoosLayer.addTo(map);
  reservesLayer.addTo(map);
  rangeLayer.addTo(map);

  const chips = document.querySelectorAll(".chip[data-layer]");

  function toggleLayer(layerName, enable) {
    if (layerName === "zoos") enable ? zoosLayer.addTo(map) : map.removeLayer(zoosLayer);
    if (layerName === "reserves") enable ? reservesLayer.addTo(map) : map.removeLayer(reservesLayer);
    if (layerName === "range") enable ? rangeLayer.addTo(map) : map.removeLayer(rangeLayer);
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const layerName = chip.dataset.layer;
      const enable = !chip.classList.contains("is-active");
      chip.classList.toggle("is-active", enable);
      toggleLayer(layerName, enable);
    });
  });

  setTimeout(() => map.invalidateSize(), 50);
});

