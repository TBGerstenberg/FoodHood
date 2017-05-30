/*Tests für die toRadians und getGeodistance Implementierungen , wie sie in 
    den Libaries lib/foodhood_geo und lib/foodhood_math zum Einsatz kommen */

var assert = require('assert');

var inspect=require('eyes').inspector({maxLength: false});

function toRadians(x){
    return x * Math.PI / 180;
}

//Implementierung der Harvesine Formula von 
//http://www.movable-type.co.uk/scripts/latlong.html
function getGeoDistance(lat1,lon1,lat2,lon2){

        var EARTH_RADIUS = 6371000; // in Meter
        var φ1 = toRadians(lat1);
        var φ2 = toRadians(lat2);
        var x1 = (lat2-lat1);
        var x2 = (lon2-lon1);  
        var Δφ = toRadians(x1);
        var Δλ = toRadians(x2);

        var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = EARTH_RADIUS * c;

        return d;
    }


//Koordinaten Ursulastraße 9 , 50668 Köln 
var geolocation1={
    lat:50.9448510,
    lng:6.9597350  
}

//Koordinaten "Plankgasse 7 , 50668 Köln 
var geolocation2 = {    
    lat:50.944851050,
    lng:6.95420506
}

var geodistance = getGeoDistance(geolocation1.lat,geolocation1.lng,geolocation2.lat,geolocation2.lng);

assert.equal(toRadians(0),0);

assert.equal(toRadians(geolocation1.lat),0.8891553868879256);

assert.equal(toRadians(geolocation2.lat),0.8891553877605902);

assert.equal(geodistance,387.429692876623);



