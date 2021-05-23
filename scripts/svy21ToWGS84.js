(function(x, y){
    // Ref: http://www.linz.govt.nz/geodetic/conversion-coordinates/projection-conversions/transverse-mercator-preliminary-computations/index.aspx
    // Code used from: https://github.com/cgcai/SVY21/blob/master/Javascript/svy21.js

    // WGS84 Datum
    const a = 6378137;
    const f = 1 / 298.257223563;

    // SVY21 Projection
    // Fundamental point: Base 7 at Pierce Resevoir.
    // Latitude: 1 22 02.9154 N, longitude: 103 49 31.9752 E (of Greenwich).

    // Known Issue: Setting (oLat, oLon) to the exact coordinates specified above
	// results in computation being slightly off. The values below give the most 
    // accurate represenation of test data.
    const oLat = 1.366666;     // origin's lat in degrees
    const oLon = 103.833333;   // origin's lon in degrees
    const oN = 38744.572;      // false Northing
	const oE = 28001.642;      // false Easting
    const k = 1;               // scale factor

    // initializing constants
    const b = a * (1 - f);
    const e2 = (2 * f) - (f * f);
    const e4 = e2 * e2;
    const e6 = e4 * e2;
    const A0 = 1 - (e2 / 4) - (3 * e4 / 64) - (5 * e6 / 256);
    const A2 = (3. / 8.) * (e2 + (e4 / 4) + (15 * e6 / 128));
    const A4 = (15. / 256.) * (e4 + (3 * e6 / 4));
    const A6 = 35 * e6 / 3072;

    const calcM = function(lat, lon){
        const latR = lat * Math.PI / 180;
        return a * ((A0 * latR) - (A2 * Math.sin(2 * latR)) + (A4 * Math.sin(4 * latR)) - (A6 * Math.sin(6 * latR)));
    };
            
    const calcRho = function(sin2Lat){
        const num = a * (1 - e2);
        const denom = Math.pow(1 - e2 * sin2Lat, 3. / 2.);
        return num / denom;
    };

    const calcV = function(sin2Lat){
        const poly = 1 - e2 * sin2Lat;
        return a / Math.sqrt(poly);
    };
    
    const computeLatLon = function(N, E){
        //	Returns a pair (lat, lon) representing Latitude and Longitude.
        
        const Nprime = N - oN;
        const Mo = calcM(oLat);
        const Mprime = Mo + (Nprime / k);
        const n = (a - b) / (a + b);
        const n2 = n * n;
        const n3 = n2 * n;
        const n4 = n2 * n2;
        const G = a * (1 - n) * (1 - n2) * (1 + (9 * n2 / 4) + (225 * n4 / 64)) * (Math.PI / 180);
        const sigma = (Mprime * Math.PI) / (180. * G);
        
        const latPrimeT1 = ((3 * n / 2) - (27 * n3 / 32)) * Math.sin(2 * sigma);
        const latPrimeT2 = ((21 * n2 / 16) - (55 * n4 / 32)) * Math.sin(4 * sigma);
        const latPrimeT3 = (151 * n3 / 96) * Math.sin(6 * sigma);
        const latPrimeT4 = (1097 * n4 / 512) * Math.sin(8 * sigma);
        const latPrime = sigma + latPrimeT1 + latPrimeT2 + latPrimeT3 + latPrimeT4;

        const sinLatPrime = Math.sin(latPrime);
        const sin2LatPrime = sinLatPrime * sinLatPrime;

        const rhoPrime = calcRho(sin2LatPrime);
        const vPrime = calcV(sin2LatPrime);
        const psiPrime = vPrime / rhoPrime;
        const psiPrime2 = psiPrime * psiPrime;
        const psiPrime3 = psiPrime2 * psiPrime;
        const psiPrime4 = psiPrime3 * psiPrime;
        const tPrime = Math.tan(latPrime);
        const tPrime2 = tPrime * tPrime;
        const tPrime4 = tPrime2 * tPrime2;
        const tPrime6 = tPrime4 * tPrime2;
        const Eprime = E - oE;
        const x = Eprime / (k * vPrime);
        const x2 = x * x;
        const x3 = x2 * x;
        const x5 = x3 * x2;
        const x7 = x5 * x2;

        // Compute Latitude
        const latFactor = tPrime / (k * rhoPrime);
        const latTerm1 = latFactor * ((Eprime * x) / 2);
        const latTerm2 = latFactor * ((Eprime * x3) / 24) * ((-4 * psiPrime2) + (9 * psiPrime) * (1 - tPrime2) + (12 * tPrime2));
        const latTerm3 = latFactor * ((Eprime * x5) / 720) * ((8 * psiPrime4) * (11 - 24 * tPrime2) - (12 * psiPrime3) * (21 - 71 * tPrime2) + (15 * psiPrime2) * (15 - 98 * tPrime2 + 15 * tPrime4) + (180 * psiPrime) * (5 * tPrime2 - 3 * tPrime4) + 360 * tPrime4);
        const latTerm4 = latFactor * ((Eprime * x7) / 40320) * (1385 - 3633 * tPrime2 + 4095 * tPrime4 + 1575 * tPrime6);
        const lat = latPrime - latTerm1 + latTerm2 - latTerm3 + latTerm4;

        // Compute Longitude
        const secLatPrime = 1. / Math.cos(lat);
        const lonTerm1 = x * secLatPrime;
        const lonTerm2 = ((x3 * secLatPrime) / 6) * (psiPrime + 2 * tPrime2);
        const lonTerm3 = ((x5 * secLatPrime) / 120) * ((-4 * psiPrime3) * (1 - 6 * tPrime2) + psiPrime2 * (9 - 68 * tPrime2) + 72 * psiPrime * tPrime2 + 24 * tPrime4);
        const lonTerm4 = ((x7 * secLatPrime) / 5040) * (61 + 662 * tPrime2 + 1320 * tPrime4 + 720 * tPrime6);
        const lon = (oLon * Math.PI / 180) + lonTerm1 - lonTerm2 + lonTerm3 - lonTerm4;

        return {lat: lat / (Math.PI / 180), lon: lon / (Math.PI / 180)};
    };
    window.computeLatLon = computeLatLon;
})(window);