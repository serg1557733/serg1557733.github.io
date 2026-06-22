let position;
let map;

let vectorSource;
let vectorLayer;

let routeSource;
let routeLayer;

let routeClickBound = false;
const k = "0edffca6-be52-49cb-a5ea-8d322dcad1dd";
//write with Java or Angular
// // save prices im Localstorage ?
// // create graph for pricing with auto request 15 min
async function startApp() {
  const loader = document.getElementById("gps-status");
  // const lastPrice = document.localStorage.getItem(PRICE) ?? {
  //   time: new Date().time,
  // };
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

function createApp(p, radius = 5) {
  const start = [p.coords.longitude, p.coords.latitude];

  const userCoords = ol.proj.fromLonLat(start);

  // Promise.resolve({
  //   ok: true,
  //   license: "CC BY 4.0 -  https:\/\/creativecommons.tankerkoenig.de",
  //   data: "MTS-K",
  //   status: "ok",
  //   stations: [
  //     {
  //       id: "2db9e64f-dbb9-4b9b-bf8c-27cbdb7f5e9d",
  //       name: "Sprint Ilmenau Schleusinger Allee",
  //       brand: "Sprint",
  //       street: "Schleusinger Allee",
  //       place: "Ilmenau",
  //       lat: 50.682407,
  //       lng: 10.908607,
  //       dist: 1,
  //       diesel: 1.959,
  //       e5: 2.039,
  //       e10: 1.979,
  //       isOpen: true,
  //       houseNumber: "21 a",
  //       postCode: 98693,
  //     },
  //     {
  //       id: "1d6fc31f-dd63-4388-b45f-99845d9eaf55",
  //       name: "TotalEnergies Ilmenau",
  //       brand: "TotalEnergies",
  //       street: "Grenzhammer",
  //       place: "Ilmenau",
  //       lat: 50.678669,
  //       lng: 10.935988,
  //       dist: 1.1,
  //       diesel: 1.969,
  //       e5: 2.049,
  //       e10: 1.989,
  //       isOpen: true,
  //       houseNumber: "4",
  //       postCode: 98693,
  //     },
  //     {
  //       id: "0139fb5f-fe75-4d06-9e88-4ed45a862fea",
  //       name: "Shell Ilmenau Ziolkowskistr. 9",
  //       brand: "Shell",
  //       street: "Ziolkowskistr.",
  //       place: "Ilmenau",
  //       lat: 50.695109,
  //       lng: 10.927974,
  //       dist: 1.3,
  //       diesel: 1.969,
  //       e5: 2.049,
  //       e10: 1.989,
  //       isOpen: true,
  //       houseNumber: "9",
  //       postCode: 98693,
  //     },
  //     {
  //       id: "b43b89b9-798a-4d2f-891d-8df0a41d0545",
  //       name: "ILMENAU - BUECHELOHER STR.\/B 87",
  //       brand: "AGIP ENI",
  //       street: "Buecheloher Str.",
  //       place: "Ilmenau",
  //       lat: 50.690343428429,
  //       lng: 10.94027343649,
  //       dist: 1.4,
  //       diesel: 1.969,
  //       e5: 2.049,
  //       e10: 1.989,
  //       isOpen: true,
  //       houseNumber: "16",
  //       postCode: 98693,
  //     },
  //     {
  //       id: "ab9d0fe4-64e8-4a61-808f-c2e4ac84c270",
  //       name: "TotalEnergies Ilmenau",
  //       brand: "TotalEnergies",
  //       street: "Erfurter Str.",
  //       place: "Ilmenau",
  //       lat: 50.691333,
  //       lng: 10.904988,
  //       dist: 1.5,
  //       diesel: 1.969,
  //       e5: 2.049,
  //       e10: 1.989,
  //       isOpen: true,
  //       houseNumber: "60",
  //       postCode: 98693,
  //     },
  //     {
  //       id: "005056ba-7cb6-1ed2-bceb-c4e92d668d53",
  //       name: "star Tankstelle",
  //       brand: "STAR",
  //       street: "Erfurter Stra\u00dfe",
  //       place: "Ilmenau",
  //       lat: 50.693076,
  //       lng: 10.900862,
  //       dist: 1.8,
  //       diesel: 1.929,
  //       e5: 2.009,
  //       e10: 1.959,
  //       isOpen: false,
  //       houseNumber: "65",
  //       postCode: 98693,
  //     },
  //     {
  //       id: "3786e71d-2c37-47ff-b8fb-408fbc6d2dee",
  //       name: "Th\u00fcringer Wald S\u00fcd",
  //       brand: "ARAL",
  //       street: "BAB 71",
  //       place: "Geraberg",
  //       lat: 50.72531,
  //       lng: 10.8458109,
  //       dist: 7.1,
  //       diesel: 2.459,
  //       e5: 2.509,
  //       e10: 2.449,
  //       isOpen: true,
  //       houseNumber: "",
  //       postCode: 98716,
  //     },
  //     {
  //       id: "4af5e1d3-16b8-43bf-2887-304e64861987",
  //       name: "Gulf Geraberg",
  //       brand: "GULF",
  //       street: "Elgersburger Str.",
  //       place: "Geratal OTGeraberg",
  //       lat: 50.7118,
  //       lng: 10.8295,
  //       dist: 7.3,
  //       diesel: 1.959,
  //       e5: 2.059,
  //       e10: null,
  //       isOpen: true,
  //       houseNumber: "1",
  //       postCode: 99331,
  //     },
  //     {
  //       id: "1e5a6f9f-9409-4a4e-bd4d-a2316907ee58",
  //       name: "Th\u00fcringer Wald Nord",
  //       brand: "ESSO",
  //       street: "BAB 71",
  //       place: "Geraberg",
  //       lat: 50.7265129,
  //       lng: 10.8439121,
  //       dist: 7.3,
  //       diesel: 2.459,
  //       e5: 2.509,
  //       e10: 2.449,
  //       isOpen: true,
  //       houseNumber: "",
  //       postCode: 98716,
  //     },
  //     {
  //       id: "230b3009-1ba5-4741-8a32-5d127780921c",
  //       name: "AVIA XPress",
  //       brand: "AVIA XPress",
  //       street: "Gro\u00dfbreitenbacher Stra\u00dfe",
  //       place: "Ilmenau",
  //       lat: 50.63887,
  //       lng: 11.00272,
  //       dist: 7.5,
  //       diesel: 1.899,
  //       e5: 1.979,
  //       e10: 1.929,
  //       isOpen: true,
  //       houseNumber: "31a",
  //       postCode: 98694,
  //     },
  //   ],
  // })
  fetch(
    `https://creativecommons.tankerkoenig.de/json/list.php?lat=${p.coords.latitude}&lng=${p.coords.longitude}&rad=${radius}&type=all&apikey=${k}`,
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
        <div class='logo'><img src="./icon-512.png" width="50" height="50" alt="logo">        <h1>Fuel Finder</h1></div>

          <label>
            Sort:
            <select id="sort-select">
              <option value="dist">Distance</option>
              <option value="diesel">Diesel</option>
              <option value="e5">E5</option>
              <option value="e10">E10</option>
            </select>  
            <select id="radiusSelect">
            <option value="2">2 km</option>
            <option value="5" selected >5 km</option>
            <option value="10">10 km</option>
            <option value="20">20 km</option>
          </select>
          </label>

        
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
          const mapUrl = /iPhone|iPad|iPod|AppleWebKit/i.test(
            navigator.userAgent,
          )
            ? `https://maps.apple.com/?ll=${station.lat},${station.lng}&q=${encodeURIComponent(station.name)}`
            : `https://www.google.com/maps?q=${station.lat},${station.lng}`;
          card.innerHTML = `
  <div class="station-header">
  <div class='logo'>   <p class="status-badge ${station.isOpen ? "open" : "closed"}">
        ${station.isOpen ? "OPEN" : "CLOSED"}
      </p>
   <p class="brand">
   ${station.brand || ""}</p></div>
 
   <p>${station.name}</p>

    <span class="distance">${station.dist} km</span>
  </div>


  <div class="fuel-prices">
    <div class="fuel">
      <span class="fuel-label">E5</span>
      <span class="fuel-value">${station.e5 ?? "—"} €</span>
    </div>

    <div class="fuel">
      <span class="fuel-label">E10</span>
      <span class="fuel-value">${station.e10 ?? "—"} €</span>
    </div>

    <div class="fuel">
      <span class="fuel-label">Diesel</span>
    <span class="fuel-value diesel-price">
                  ${station.diesel ?? "—"} €
          </span>    </div>
  </div>
    <div class="station-address">
     📍${station.postCode || ""}, ${station.place || ""},
    ${station.street || ""} , ${station.houseNumber || ""}
  </div>
  <a
    class="navigate-btn"
    href="${mapUrl}"
    target="_blank"
    rel="noopener"
  >
    ${station.dist} km 🧭 OPEN IN MAPS
  </a>
`;

          stationsContainer.appendChild(card);

          function openInAppleMaps(lat, lng, name = "") {
            const url = `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(name)}`;
            window.open(url, "_blank");
          }
        });
      }

      renderStations("diesel");
      document.getElementById("gps-status").remove();
    })
    .catch((e) => {
      console.error(e);
      const loader = document.getElementById("gps-status");
      loader.style.display = "flex";
      loader.innerHTML += `<h2>${e?.message}</h2>`;
    });
}
