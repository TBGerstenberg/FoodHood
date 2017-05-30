
var math = require('./foodhood_math.js');
var http = require('http');

module.exports = {
    /*
    * Löst mithilfe vom npm Modul "Geocoder" eine Adresse in ein {latitude,longitude} Paar auf
    * https://www.npmjs.com/package/geocoder 
    * Dieses Modul setzt auf Googles Geocoding API auf 
    * Dieder Wrapper dient der Austauschbarkeit des verwendeten Dienstes 
    */
    geocode:function(adressString,callback){

        console.log("GEOCODER USED");
        geocoder.geocode(adressString,function(err,data){
            assert.equal(null,err);
            //inspect(data);
            var latLng = data.results[0].geometry.location;
            //inspect(latLng);
            callback(err,latLng);
        });
    },

    /*
    * Liefert einen Querystring für eine Distancematrix-Anfrage bei einer OSRM-Instanz 
    * @param route = Array von Latitude,Longitude Pairs 
    * @param callback = function (err,distanceMatrix)
    */
    getOsrmQueryString:function (route,serviceName,callback){

        var err = null;

        if(!route){
            err = new Error("No route specified in Call to getOsrmQueryString");
        }

        var OSRM_RequestPath;

        switch(serviceName){
            case "table":
                OSRM_RequestPath="/table?";
                break;

            case "viaroute":
                OSRM_RequestPath="/viaroute?";

            default:
                err=new Error("Unsupported Service Type in Call to getOsrmQueryString");   
                break;
        }


        async.each(route,function(item, next){
            OSRM_RequestPath=OSRM_RequestPath.concat("loc="+item[0]+","+item[1]+"&");
            next();
        },function(err){
            OSRM_RequestPath=OSRM_RequestPath.substr(0,OSRM_RequestPath.length-1);
            callback(err,OSRM_RequestPath);
        });
    },

    /* Stellt einen Table-Service Request an 
    *  eine OSRM(Open Source Routing Engine) Instanz 
    *  und liefert eine DistanzTabelle
    *  @Param osrm_distanceTableQueryString  - Beispiel : http://127.0.0.1:5000/table?loc=50.937687,6.961038&loc=51.937688,6.961039&loc=51.937688,6.961040
    *  @callback {err,distancetable}
    */
    getOsrmDistanceTable:function(osrm_distanceTableQueryString,callback){

        //Host und Portnummer für Anfragen an die selbstgehostete OSRM Instanz 
        var OSRM_HOST ="localhost";
        var OSRM_PORT = 5000;

        inspect(osrm_distanceTableQueryString);
        var osrm_distanceTableRequestOptions={
            host: OSRM_HOST,
            port: OSRM_PORT,
            path: osrm_distanceTableQueryString,
            method:"GET",
            headers:{
                accept:"application/json"
            }
        }

        var osrm_distanceTableRequest = http.request(osrm_distanceTableRequestOptions, function(osrm_distanceTableResponse){

            var error;

            if(osrm_distanceTableResponse.status==200){
                error=true;
            }

            osrm_distanceTableResponse.on('data',function(distanceTableData){
                if(error){
                    callback(err,null);
                }
                else{
                    callback(null,JSON.parse(distanceTableData).distance_table); 
                }
            });
        });
        osrm_distanceTableRequest.end();
    },

    /*
    *
    *
    *
    *
    *
    */
    getOsrmRoute:function(osrm_QueryString,callback){

        //http://{server}/viaroute?loc={lat,lon}&loc={lat,lon}<&loc={lat,lon} ...>

        //Host und Portnummer für Anfragen an die selbstgehostete OSRM Instanz 
        var OSRM_HOST ="localhost";
        var OSRM_PORT = 5000;

        var RequestOptions={
            host: OSRM_HOST,
            port: OSRM_PORT,
            path: osrm_QueryString,
            method:"GET",
            headers:{
                accept:"application/json"
            }
        }

        var osrm_viaRouteRequest = http.request(RequestOptions, function(osrmViaRouteResponse){

            var error;

            if(osrmViaRouteResponse.status==200){
                error=true;
            }

            osrmViaRouteResponse.on('data',function(routingdata){
                if(error){
                    callback(err,null);
                }
                else{
                    callback(null,JSON.parse(routingdata)); 
                }
            });
        });
        osrm_viaRouteRequest.end();

    },

    /*
    Berechnet Abstände auf einer Kugel mit der Harvesine-Formel 
    Quelle des Codes: http://www.movable-type.co.uk/scripts/latlong.html */
    getGeoDistance :function (lat1,lon1,lat2,lon2){

        var EARTH_RADIUS = 6371000; // in Meter
        var φ1 = math.toRadians(lat1);
        var φ2 = math.toRadians(lat2);
        var x1 = (lat2-lat1);
        var x2 = (lon2-lon1);  
        var Δφ = math.toRadians(x1);
        var Δλ = math.toRadians(x2);

        var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = EARTH_RADIUS * c;

        return d;
    }
}