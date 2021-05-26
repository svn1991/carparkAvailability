let map = L.map('map');
map.setView([1.3598, 103.8107], 12);
map.setMaxBounds(map.getBounds());
map.setMinZoom(12);
// L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
//     attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
//     maxZoom: 18,
//     id: 'mapbox/streets-v11',
//     tileSize: 512,
//     zoomOffset: -1,
//     accessToken: 'pk.eyJ1Ijoic3ZuMTk5MSIsImEiOiJja3AweWJ0ZWUxNzI3MnZxd3QxcDE5aW04In0.z57VRWDFDrTnL6LVF8UT8Q'
// }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

L.Control.geocoder({
    geocoder: L.Control.Geocoder.nominatim({
        geocodingQueryParams: {countrycodes: 'SG'}
    })
}).addTo(map);

window.addEventListener("DOMContentLoaded", async function () {
    const carparks = await getHDBCarParksInfo();
    carparks.forEach(carpark => {
        L.marker([carpark.x_coord, carpark.y_coord]).addTo(map).bindPopup(carpark.address);
    });
});
