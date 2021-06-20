const currentLocationIcon = L.icon({
    iconUrl: "images/location.png",
    iconSize: [45, 50],
    iconAnchor: [25, 60],
});

const availableLotsIcon = L.icon({
    iconUrl: "images/available.png",
    iconSize: [35, 35],
    iconAnchor: [25, 20],
    className: 'icon-available',
});

const fillingUpLotsIcon = L.icon({
    iconUrl: "images/fillingUp.png",
    iconSize: [30, 30],
    iconAnchor: [25, 20],
    className: 'icon-filling-up',
});

const closeToFullLotsIcon = L.icon({
    iconUrl: "images/closeToFull.png",
    iconSize: [25, 25],
    iconAnchor: [25, 20],
    className: 'icon-close-to-full',
});

const unavailableLotsIcon = L.icon({
    iconUrl: "images/unavailableLocation.png",
    iconSize: [25, 25],
    iconAnchor: [25, 20],
    className: 'icon-unavailable',
});

let searchLocation;

let map = L.map('map');
map.setView([1.3598, 103.8107], 12);
map.setMaxBounds(map.getBounds());
map.setMinZoom(12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let markerClusters = L.markerClusterGroup();
map.addLayer(markerClusters);

const geocoder = L.Control.geocoder({
    geocoder: L.Control.Geocoder.nominatim({
        geocodingQueryParams: {countrycodes: 'SG'}
    }),
    defaultMarkGeocode: false,
}).addTo(map);

geocoder.on('markgeocode', function(e) {
    if (searchLocation) {
        map.removeLayer(searchLocation);
    }
    const latlng = e.geocode.center;
    searchLocation = L.marker(latlng,{icon: currentLocationIcon}).addTo(map);
    map.fitBounds(e.geocode.bbox);
  })
  .addTo(map);

const createCarparkMarker = (carparkNumber) => {
    const {x_coord, y_coord, address} = carparksInfo[carparkNumber];
    const marker = L.marker([x_coord, y_coord], {icon: getAvailabilityStatusIcon(carparkNumber)}).bindPopup(address + '  '+ carparkNumber); //.addTo(map)
    carparksInfo[carparkNumber].mapMarker = marker;
    markerClusters.addLayer(carparksInfo[carparkNumber].mapMarker);
}

const refreshCarparkMarker = (carparkNumber) => {
    // map.removeLayer(carparksInfo[carparkNumber].mapMarker);
    markerClusters.removeLayer(carparksInfo[carparkNumber].mapMarker);
    createCarparkMarker(carparkNumber);
}

const getAvailabilityStatusIcon = (carparkNumber) => {
    let carpark = carparksInfo[carparkNumber];
    const lots_available = Math.floor(carpark.lots_available/carpark.lots_total*100);
    if (carpark.lots_available === 0) {
        return unavailableLotsIcon;
    } else if (lots_available < 30 || carpark.lots_available <= 10) {
        return closeToFullLotsIcon;
    } else if (lots_available < 70) {
        return fillingUpLotsIcon;
    } else {
        return availableLotsIcon;
    }
}

const refreshAndUpdateAvailabilityMarkers = async () => {
    const carparkLots = await getCarParksAvailabilityResponse();
    carparkLots.forEach(({carpark_number, carpark_info, update_datetime}) => {
        carpark_info.forEach(({lots_available, lot_type}) => {
            if (lot_type === "C") {
                if (carparksInfo[carpark_number]) {
                    const updated_lots_available = parseInt(lots_available);
                    // carparksInfo['AM14'].lots_available = 0;
                    if (carparksInfo[carpark_number].lots_available !== updated_lots_available) {
                        console.log('Update car park lots available: '+ carpark_number);
                        carparksInfo[carpark_number].lots_available = parseInt(lots_available);
                        // carparksInfo['AM14'].lots_available = 0;
                        refreshCarparkMarker(carpark_number);

                    }
                    carparksInfo[carpark_number].lots_last_updated = update_datetime;
                }
            }
        });
    });
}

window.addEventListener("DOMContentLoaded", async function () {
    await getHDBCarParksInfo();
    await initializeHDBCarParksAvailability();
    carparksList.forEach(carparkNumber => {
        createCarparkMarker(carparkNumber);
    });
    setInterval(() => {
        console.log('Parking Lots info refreshed at: '+ availabilityLastRetrieved);
        refreshAndUpdateAvailabilityMarkers();
    }, 60000);
});

$('#tab-toggle').click(() => {
    $('#myTabContent').slideToggle();
    $('#tab-toggle svg').toggleClass('fa-rotate-180');
});




