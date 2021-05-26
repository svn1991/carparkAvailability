let carparksList = [];
const carparksInfo = {};
let availabilityLastRetrieved;

const convertSVY21ToWGS84 = (x,y) => {
    //import proj4 from 'proj4'
    proj4.defs("EPSG:3414","+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs");
    let coords = proj4("EPSG:3414").inverse([x,y]);
    return coords;
}

const getHDBCarParksInfo = async () => {
    carparksList = await axios.get('https://data.gov.sg/api/action/datastore_search?resource_id=139a3035-e624-4f56-b63f-89ae28d4ae4c&limit=3000')
        .then(response => response.data.result.records)
        .catch(err => {
            throw Error('getHDBCarParksInfo: `${err.message}`');
        });
    // carparksList = carparksList.slice(0, 10);
    carparksList = carparksList.map(carpark => {
        const [lon, lat] = convertSVY21ToWGS84(carpark.x_coord, carpark.y_coord);
        carparksInfo[carpark.car_park_no] = {
            ...carpark,
            x_coord: lat,
            y_coord: lon,
        }
        return carpark.car_park_no;
    });
}

const getCarParksAvailabilityResponse = async () => {
    const carparkLotsObject = await axios.get('https://api.data.gov.sg/v1/transport/carpark-availability')
        .then(response => response.data.items[0])
        .catch(err => {
            throw Error('getCarParksAvailabilityResponse: `${err.message}`');
        });
    availabilityLastRetrieved = carparkLotsObject.timestamp;
    return carparkLotsObject.carpark_data;
}
const initializeHDBCarParksAvailability = async () => {
    const carparkLots = await getCarParksAvailabilityResponse();
    carparkLots.forEach(({carpark_number, carpark_info, update_datetime}) => {
        carpark_info.forEach(({total_lots, lots_available, lot_type}) => {
            if (lot_type === "C") {
                if (carparksInfo[carpark_number]) {
                    carparksInfo[carpark_number].lots_total = parseInt(total_lots);
                    carparksInfo[carpark_number].lots_available = parseInt(lots_available);
                    carparksInfo[carpark_number].lots_last_updated = update_datetime;
                } else {
                    delete carparksInfo[carpark_number];
                    carparksList = carparksList.filter(carpark => carpark !== carpark_number);
                }
            }
        });
    });
}
