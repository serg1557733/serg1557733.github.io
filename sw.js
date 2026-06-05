let position;
let map;

let vectorSource;
let vectorLayer;

let routeSource;
let routeLayer;

let routeClickBound = false;
const k = "0edffca6-be52-49cb-a5ea-8d322dcad1dd";

async function startApp() {
  const loader = document.getElementById("gps-status");
  new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject),
  )
    .then((p) => {
      position = p;
      createApp(p, 10);
      loader.style.display = "none";
    })
    .catch((e) => {
      loader.style.display = "flex";
      loader.innerHTML += `<h2>${e?.message}</h2>`;
      console.error(e);
    });
}

startApp();

function getRoute(start, end) {
  return fetch(
    `https://router.project-osrm.org/route/v1/driving/` +
      `${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`,
  )
    .then((r) => r.json())
    .then((data) => data.routes[0].geometry);
}

function createApp(p, radius = 10) {
  const start = [p.coords.longitude, p.coords.latitude];

  const userCoords = ol.proj.fromLonLat(start);

  fetch(
    `https://creativecommons.tankerkoenig.de/json/list.php?lat=${p.coords.latitude}&lng=${p.coords.longitude}&rad=${radius}&sort=dist&type=all&apikey=${k}`,
  )
    .then((r) => r.json())
    .then((data) => {
      if (!data || data.status === "error") {
        throw new Error(data?.message || "API error");
      }

      if (!Array.isArray(data?.stations)) {
        throw new Error("Invalid stations response");
      }
      // ----------------------------
      // CONTROLS (create once)
      // ----------------------------
      let controls = document.getElementById("controls");

      if (!controls.dataset.ready) {
        controls.dataset.ready = "true";

        controls.innerHTML = `
          <label>
            Sort:
            <select id="sort-select">
              <option value="dist">Distance</option>
              <option value="diesel">Diesel</option>
              <option value="e5">E5</option>
              <option value="e10">E10</option>
            </select>
          </label>

          <select id="radiusSelect">
            <option value="2">2 km</option>
            <option value="5">5 km</option>
            <option value="10" selected>10 km</option>
            <option value="20">20 km</option>
          </select>
        `;

        const radiusSelect = document.getElementById("radiusSelect");

        radiusSelect.addEventListener("change", () => {
          createApp(position, radiusSelect.value);
        });

        document
          .getElementById("sort-select")
          .addEventListener("change", (e) => {
            renderStations(e.target.value);
          });
      }

      // ----------------------------
      // USER MARKER
      // ----------------------------
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

      // ----------------------------
      // SOURCES (init once)
      // ----------------------------
      if (!vectorSource) {
        vectorSource = new ol.source.Vector();
      }

      if (!routeSource) {
        routeSource = new ol.source.Vector();
      }

      vectorSource.clear();
      vectorSource.addFeature(userMarker);

      if (!vectorLayer) {
        vectorLayer = new ol.layer.Vector({
          source: vectorSource,
        });
      }

      if (!routeLayer) {
        routeLayer = new ol.layer.Vector({
          source: routeSource,
          style: new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: "blue",
              width: 4,
            }),
          }),
        });
      }

      // ----------------------------
      // MAP (create once)
      // ----------------------------
      if (!map) {
        map = new ol.Map({
          target: "map",
          layers: [
            new ol.layer.Tile({
              source: new ol.source.OSM(),
            }),
            vectorLayer,
            routeLayer,
          ],
          view: new ol.View({
            center: userCoords,
            zoom: 13,
          }),
        });
      } else {
        map.getView().setCenter(userCoords);
      }

      // ----------------------------
      // ROUTE CLICK (bind once)
      // ----------------------------
      if (!routeClickBound) {
        routeClickBound = true;

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
      }

      // ----------------------------
      // STATIONS RENDER
      // ----------------------------
      function renderStations(sortKey) {
        const stationsContainer = document.getElementById("stations");
        stationsContainer.innerHTML = "";

        const sorted = [...data?.stations].sort((a, b) => {
          const av = a[sortKey] ?? Infinity;
          const bv = b[sortKey] ?? Infinity;
          return av - bv;
        });

        const cheapest = sorted.find((s) => s.isOpen && s[sortKey]);

        sorted.forEach((station) => {
          const isCheapest = station === cheapest;

          const stationCoords = ol.proj.fromLonLat([station.lng, station.lat]);

          const feature = new ol.Feature({
            geometry: new ol.geom.Point(stationCoords),
          });

          feature.setStyle(
            new ol.style.Style({
              image: new ol.style.Circle({
                radius: isCheapest ? 10 : 6,
                fill: new ol.style.Fill({
                  color: isCheapest
                    ? "#f59e0b"
                    : station.isOpen
                      ? "green"
                      : "red",
                }),
                stroke: new ol.style.Stroke({
                  color: "#fff",
                  width: 2,
                }),
              }),
              text: new ol.style.Text({
                text: station.name,
                offsetY: -18,
                font: "12px Arial",
                fill: new ol.style.Fill({ color: "#000" }),
                stroke: new ol.style.Stroke({
                  color: "#fff",
                  width: 3,
                }),
              }),
            }),
          );

          vectorSource.addFeature(feature);

          const card = document.createElement("div");
          card.className = `station ${station.isOpen ? "open" : "closed"}`;

          card.innerHTML = `
            <b>${station.brand}</b> ${station.name}<br>
            📍 ${station.street} ${station.houseNumber} — ${station.dist} km<br>
            E5: ${station.e5 ?? "—"}<br>
            E10: ${station.e10 ?? "—"}<br>
            Diesel: ${station.diesel ?? "—"}
          `;

          stationsContainer.appendChild(card);
        });
      }

      renderStations("diesel");
      document.getElementById("gps-status").remove();
    })
    .catch((e) => {
      console.error(e);

      document.body.insertAdjacentHTML(
        "afterbegin",
        document.getElementById("gps-status").innerHTML,
      );

      setTimeout(() => document.getElementById("gps-status")?.remove(), 4000);
    });
}
