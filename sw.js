new Promise((resolve, reject) =>
  navigator.geolocation.getCurrentPosition(resolve, reject),
).then((p) => {
  createApp(p);
});
window.addEventListener("load", () => {
  document.getElementById("loader").style.display = "none";
});
function getRoute(start, end) {
  return fetch(
    `https://router.project-osrm.org/route/v1/driving/` +
      `${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`,
  )
    .then((r) => r.json())
    .then((data) => data.routes[0].geometry);
}

function createApp(p) {
  try {
    fetch(
      `https://creativecommons.tankerkoenig.de/json/list.php?lat=${p.coords.latitude}&lng=${p.coords.longitude}&rad=7&sort=dist&type=all&apikey=0edffca6-be52-49cb-a5ea-8d322dcad1dd`,
    )
      .then((r) => r.json())
      .then((data) => {
        const start = [p.coords.longitude, p.coords.latitude];
        const userCoords = ol.proj.fromLonLat([
          p.coords.longitude,
          p.coords.latitude,
        ]);

        // селект сортировки
        const controls = document.getElementById("controls");
        controls.innerHTML = `
          <label>Сортировать по:
            <select id="sort-select">
              <option value="dist">Расстоянию</option>
              <option value="diesel">Diesel</option>
              <option value="e5">E5</option>
              <option value="e10">E10</option>
            </select>
          </label>
        `;

        // маркер пользователя
        const userMarker = new ol.Feature({
          geometry: new ol.geom.Point(userCoords),
        });
        userMarker.setStyle(
          new ol.style.Style({
            image: new ol.style.Circle({
              radius: 8,
              fill: new ol.style.Fill({ color: "blue" }),
              stroke: new ol.style.Stroke({ color: "white", width: 2 }),
            }),
          }),
        );

        // карта
        const vectorSource = new ol.source.Vector({ features: [userMarker] });
        const vectorLayer = new ol.layer.Vector({ source: vectorSource });
        const routeSource = new ol.source.Vector();
        const routeLayer = new ol.layer.Vector({
          source: routeSource,
          style: new ol.style.Style({
            stroke: new ol.style.Stroke({ color: "blue", width: 4 }),
          }),
        });

        const map = new ol.Map({
          target: "map",
          layers: [
            new ol.layer.Tile({ source: new ol.source.OSM() }),
            vectorLayer,
            routeLayer,
          ],
          view: new ol.View({ center: userCoords, zoom: 13 }),
        });

        map.on("click", async (evt) => {
          const endLonLat = ol.proj.toLonLat(evt.coordinate);
          const geometry = await getRoute(start, endLonLat);
          routeSource.clear();
          routeSource.addFeature(
            new ol.Feature({
              geometry: new ol.format.GeoJSON().readGeometry(geometry, {
                dataProjection: "EPSG:4326",
                featureProjection: "EPSG:3857",
              }),
            }),
          );
        });

        // рендер станций
        function renderStations(sortKey) {
          const stationsContainer = document.getElementById("stations");
          stationsContainer.innerHTML = "";

          // убираем старые маркеры заправок (оставляем userMarker)
          vectorSource
            .getFeatures()
            .filter((f) => f !== userMarker)
            .forEach((f) => vectorSource.removeFeature(f));

          // сортировка
          const sorted = [...data.stations].sort((a, b) => {
            const av = a[sortKey] ?? Infinity;
            const bv = b[sortKey] ?? Infinity;
            return av - bv;
          });

          // самая дешёвая по выбранному параметру (открытая)
          const cheapest = sorted.find((s) => s.isOpen && s[sortKey]);

          sorted.forEach((station) => {
            const isCheapest = station === cheapest;
            const stationCoords = ol.proj.fromLonLat([
              station.lng,
              station.lat,
            ]);

            // маркер
            const stationMarker = new ol.Feature({
              geometry: new ol.geom.Point(stationCoords),
              name: station.name,
            });

            const markerColor = isCheapest
              ? "#f59e0b"
              : station.isOpen
                ? "green"
                : "red";
            const markerRadius = isCheapest ? 10 : 6;
            const priceLabel =
              isCheapest && station[sortKey]
                ? `${station[sortKey].toFixed(3)}€`
                : station.name;

            stationMarker.setStyle(
              new ol.style.Style({
                image: new ol.style.Circle({
                  radius: markerRadius,
                  fill: new ol.style.Fill({ color: markerColor }),
                  stroke: new ol.style.Stroke({
                    color: isCheapest ? "#000" : "white",
                    width: isCheapest ? 3 : 2,
                  }),
                }),
                text: new ol.style.Text({
                  text: priceLabel,
                  offsetY: -18,
                  font: isCheapest ? "bold 13px Arial" : "12px Arial",
                  fill: new ol.style.Fill({
                    color: isCheapest ? "#b45309" : "#000",
                  }),
                  stroke: new ol.style.Stroke({ color: "#fff", width: 3 }),
                }),
              }),
            );

            vectorSource.addFeature(stationMarker);

            // карточка
            const card = document.createElement("div");
            card.className = `station ${station.isOpen ? "open" : "closed"} ${isCheapest ? "cheapest" : ""}`;
            card.innerHTML = `
              ${isCheapest ? '<div class="cheapest-badge">🏆 Дешевле всего</div>' : ""}
              <b>${station.brand}</b> ${station.name}<br>
              📍 ${station.street} ${station.houseNumber} — ${station.dist} км<br><br>
              <span class="${sortKey === "e5" && isCheapest ? "highlight" : ""}">E5: ${station.e5 ?? "—"}</span><br>
              <span class="${sortKey === "e10" && isCheapest ? "highlight" : ""}">E10: ${station.e10 ?? "—"}</span><br>
              <span class="${sortKey === "diesel" && isCheapest ? "highlight" : ""}">Diesel: ${station.diesel ?? "—"}</span>
            `;
            stationsContainer.appendChild(card);
          });
        }

        // первый рендер
        renderStations("diesel");

        // при смене сортировки
        document
          .getElementById("sort-select")
          .addEventListener("change", (e) => {
            renderStations(e.target.value);
          });
      });
  } catch {
    document.body.innerText = "Error getting data from server";
  }
}
