new Promise((resolve, reject) =>
  navigator.geolocation.getCurrentPosition(resolve, reject),
).then((p) => {
  fetch(
    `https://creativecommons.tankerkoenig.de/json/list.php?lat=${p.coords.latitude}&lng=${p.coords.longitude}&rad=10&sort=dist&type=all&apikey=0edffca6-be52-49cb-a5ea-8d322dcad1dd`,
  )
    .then((r) => r.json())
    .then((data) => {
      const stationsContainer = document.getElementById("stations");

      // координаты пользователя
      const userCoords = ol.proj.fromLonLat([
        p.coords.longitude,
        p.coords.latitude,
      ]);

      // маркер пользователя
      const userMarker = new ol.Feature({
        geometry: new ol.geom.Point(userCoords),
      });
      const start = [p.coords.longitude, p.coords.latitude];
      userMarker.setStyle(
        new ol.style.Style({
          image: new ol.style.Circle({
            radius: 8,
            fill: new ol.style.Fill({
              color: "blue",
            }),
            stroke: new ol.style.Stroke({
              color: "white",
              width: 2,
            }),
          }),
        }),
      );

      // все фичи
      const features = [userMarker];

      // заправки
      data.stations?.forEach((station) => {
        // точка на карте
        const stationCoords = ol.proj.fromLonLat([station.lng, station.lat]);

        const stationMarker = new ol.Feature({
          geometry: new ol.geom.Point(stationCoords),
          name: station.name,
        });

        stationMarker.setStyle(
          new ol.style.Style({
            image: new ol.style.Circle({
              radius: 6,
              fill: new ol.style.Fill({
                color: station.isOpen ? "green" : "red",
              }),
              stroke: new ol.style.Stroke({
                color: "white",
                width: 2,
              }),
            }),
            text: new ol.style.Text({
              text: station.name,
              offsetY: -15,
              font: "12px Arial",
              fill: new ol.style.Fill({
                color: "#000",
              }),
              stroke: new ol.style.Stroke({
                color: "#fff",
                width: 3,
              }),
            }),
          }),
        );

        features.push(stationMarker);

        // карточка
        stationsContainer.innerHTML += `
          <div class="station ${station.isOpen ? "open" : "closed"}">
            <b>${station.brand}</b><br>
            ${station.name}<br>
            ${station.street} ${station.houseNumber}<br>
            ${station.dist} км<br><br>

            E5: ${station.e5 ?? "—"}<br>
            E10: ${station.e10 ?? "—"}<br>
            Diesel: ${station.diesel ?? "—"}
          </div>
        `;
      });

      // слой со всеми точками
      const vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
          features,
        }),
      });

      // карта
      const map = new ol.Map({
        target: "map",

        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM(),
          }),

          vectorLayer,
        ],

        view: new ol.View({
          center: userCoords,
          zoom: 13,
        }),
      });
      const routeSource = new ol.source.Vector();

      const routeLayer = new ol.layer.Vector({
        source: routeSource,
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: "blue",
            width: 4,
          }),
        }),
      });

      map.addLayer(routeLayer);
      map.on("click", async function (evt) {
        console.log(evt);
        const endLonLat = ol.proj.toLonLat(evt.coordinate);

        const geometry = await getRoute(start, endLonLat);

        // очистка старого маршрута
        routeSource.clear();

        // рисуем маршрут
        const routeFeature = new ol.Feature({
          geometry: new ol.format.GeoJSON().readGeometry(geometry, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          }),
        });

        routeSource.addFeature(routeFeature);
      });
    });
});
function getRoute(start, end) {
  return fetch(
    `https://router.project-osrm.org/route/v1/driving/` +
      `${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`,
  )
    .then((r) => r.json())
    .then((data) => data.routes[0].geometry);
}
