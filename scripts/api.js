// const convertSVY21ToWGS84 = async (x,y) => {
//     const url = `https://developers.onemap.sg/commonapi/convert/3414to4326?X=${x}&Y=${y}`;
//     const wgs84 = await axios.get(url)
//         .then((response) => response.data)
//         .error((err) => {
//             throw Error('convertSVY21ToWGS84: `${err.message}`');
//         });
//     return [wgs84.latitude, wgs84.longitude];
// }

// await Promise.all(carparks.map(async (carpark) => {
//     const [x,y] = await convertSVY21ToWGS84(carpark.x_coord, carpark.y_coord);
//     carpark.x_coord = x;
//     carpark.y_coord = y;
// }));

const convertSVY21ToWGS84 = (x,y) => {
    //import proj4 from 'proj4'
    proj4.defs("EPSG:3414","+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs");
    let coords = proj4("EPSG:3414").inverse([x,y]);
    console.log(coords);
    return coords;
}

const getHDBCarParksInfo = async () => {
    let carparks = await axios.get('https://data.gov.sg/api/action/datastore_search?resource_id=139a3035-e624-4f56-b63f-89ae28d4ae4c&limit=3000')
        .then(response => response.data.result.records)
        .catch(err => {
            throw Error('getHDBCarParksInfo: `${err.message}`');
        });
    carparks = carparks.slice(0, 10);
    carparks.map(carpark => {
        const [lon, lat] = convertSVY21ToWGS84(carpark.x_coord, carpark.y_coord);
       // const {lat,lon} = computeLatLon(carpark.x_coord, carpark.y_coord);
        carpark.x_coord = lat;
        carpark.y_coord = lon;
    });
    return carparks;
}