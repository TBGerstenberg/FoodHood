//eyes modul für farbige Konsolenausgaben , maxlength : false hebt die Depth-level Grenze der Anzeige auf 
var inspect=require('eyes').inspector({maxLength: false});

//async Modul für übersichtliches abwickeln mehrerer asynchroner Operationen 
var async=require('async');

//http Modul für Kommunikation über das http-Protokoll 
var http=require('http');

//Host und Portnummer für Anfragen an die selbstgehostete OSRM Instanz 
var OSRM_HOST ="localhost";
var OSRM_PORT = 5000;

//Köln Ursulastraße 9
var koords1=[50.9448510,6.9542050];

//Köln PLankgasse 7
var koords2=[50.946793050,6.9521560];

//Köln Weidengasse 3 
var koords3=[50.9475500,6.95625606];

//Köln Jakordenstraße 10 
var koords4 = [50.9454590,6.95973506];

var route= [koords1,koords2,koords3,koords4];

async.waterfall([
    function(callback){

        getOsrmQueryString(route,function(err,osrm_distanceTableQueryString){
            inspect(osrm_distanceTableQueryString);
            callback(null,osrm_distanceTableQueryString);
        });

    },function(osrm_distanceTableQueryString,callback){

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
            osrm_distanceTableResponse.on('data',function(distanceTableData){
                var distanceTable=JSON.parse(distanceTableData);
                callback(null,distanceTable);
            });
        });
        osrm_distanceTableRequest.end();

    },function(distanceTableData,callback){

        inspect(distanceTableData);

        dijkstra(distanceTableData.distance_table,function(shortest_path){

        });     
    }]);

/*
Findet in einer OSRM Distance-Table 
den kürzesten Pfad. 
*/
function dijkstra(distanceMatrix,callback){

    //Kürzeste Abarbeitungsreihenfolge 
    var route = [];

    //Gefundener kürzester Weg
    var minDistance = Infinity;

    //Markierung für bereits gefundene Knoten 
    var KNOTEN_BEREITS_IN_ROUTE=-1;

    //Laenge der fertigen Route wird als Bestandteil der Abbruchbedingung genutzt 
    var LAENGE_DER_FERTIGEN_ROUTE=distanceMatrix.length;

    //Wir beginnen beim Startknoten, Xindex 0 
    var startknotenIndex = 0;

    //Startknoten in die Route pushen 
    route.push({
        ReihenfolgeIndex:0,
        travelTime:0
    });

    //Index des Knotens an dem ein Minimum gefunden wurde
    var yIndexOfMinimum;
    
    //Zählervariable zur Nummerierung der gefundenen Stationen s
    var roundindex=0;

    //Bis alle Knoten in die Route eingebaut sind 
    while(route.length != LAENGE_DER_FERTIGEN_ROUTE){

        console.log("DUrchsuche Zeile mit index "+roundindex);
        roundindex++;

        //Betrachte Kanten zu allen anderen , noch nicht bearbeiteten Knoten 
        for(var k=0;k<LAENGE_DER_FERTIGEN_ROUTE;k++){

            //Distanzen entlang der Hauptdiagonale sind = 0(Distanz eines Knotens zu sich selbst) und müssen nicht betrachtet werden 
            //Bereits in der Route eingebaute Knoten werden mit einer Konstante markiert und ebenfalls ausgeschlossen  
            if(k != startknotenIndex && distanceMatrix[startknotenIndex][k] != KNOTEN_BEREITS_IN_ROUTE){

                //Betrachte die Distanz zu jedem verbleibenden Knoten und finde den mit der geringsten Distanz
                if(distanceMatrix[startknotenIndex][k] < minDistance ){

                    minDistance=distanceMatrix[startknotenIndex][k];
                    
                    //Den Knoten an dem das Minimum gefunden wurde merken 
                    yIndexOfMinimum=k;
                }
            }
        }

        //Weiteren Knoten und die Traveling-Time zwischen diesem und dem vorangegengenen Knoten merken 
        route.push({
            ReihenfolgeIndex:roundindex,
            travelTime:minDistance
        });

        //Nachdem ein nächster Knoten gefunden wurde markiere die Spalte des Betrachteten Knotens als "BEREITS IN ROUTE"
        for(var i=0;i<LAENGE_DER_FERTIGEN_ROUTE;i++){
            distanceMatrix[startknotenIndex][i] = KNOTEN_BEREITS_IN_ROUTE;
        }

        //Der nächste durchlauf beginnt beim gefundenen Minimum 
        startknotenIndex = yIndexOfMinimum;

        //Mindistance zurücksetzen 
        minDistance=Infinity;

        console.log("Nach Durchlauf "+ roundindex);
        inspect(route);
        inspect(distanceMatrix);
    }
    
    console.log("Der kürzeste Pfad, wenn mit Knoten an Index[0][0] begonnen werden soll");
    inspect(route);
    callback(route);
}

/*
Liefert einen Querystring für eine Distancematrix-Anfrage bei einer OSRM-Instanz 
@param route = Array von Latitude,Longitude Pairs 
@param callback = function (err,distanceMatrix)
*/
function getOsrmQueryString(route,callback){

    var err = null;

    if(!route){
        err = new Error("No route specified in Call to getOsrmQueryString");
    }

    var OSRM_distanceMatrixRequestPath ="/table?";

    async.each(route,function(item, next){
        OSRM_distanceMatrixRequestPath=OSRM_distanceMatrixRequestPath.concat("loc="+item[0]+","+item[1]+"&");
        next();
    },function(err){
        OSRM_distanceMatrixRequestPath=OSRM_distanceMatrixRequestPath.substr(0,OSRM_distanceMatrixRequestPath.length-1);
        callback(err,OSRM_distanceMatrixRequestPath);
    });
}





/*
var sammelaktion =
                {
                    "streckenlaenge":3,
                    "route":[
                        {
                            "reihenfolgeindex":0,
                            "standort":{
                                "region": "NRW",
                                "country-name": "Germany",
                                "postal-code": "50668",
                                "street-address": "Ursulastraße 30"
                            },
                            "ankunftszeitpunkt":"2015-12-15T09:00:00.252Z",
                            "istabgeholt":true
                        },
                        {
                            "reihenfolgeindex":1,
                            "standort":{
                                "region": "NRW",
                                "country-name": "Germany",
                                "postal-code": "50668",
                                "street-address":"Eintrachtstraße 20"
                            },
                            "ankunftszeitpunkt":"2015-12-15T09:30:00.252Z",
                            "istabgeholt":true
                        }
                    ],
                    "gesamtgewicht":7,
                    "fortbegegungsmittel":"Auto",
                    "zielstandort":{
                        "region": "NRW",
                        "country-name": "Germany",
                        "postal-code": "50668",
                        "street-address": "Ursulastraße 30"
                    },
                    "sammler":"/Benutzer/23",
                    "betroffeneAngebote":["/Angebot/1","Angebot/8","/Angebot/9"]
                }
            } 
            */

