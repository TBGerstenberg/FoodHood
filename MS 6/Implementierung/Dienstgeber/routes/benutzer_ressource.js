var app = express.Router();

//Eigene kleine Libary zur Auslagerung wiederkehrender Aufgaben in der Kommunikation mit MongoDb
var lib = require('../lib/foodhood_db.js');

//Libary zur Auslagerung von Anfragen an die OSRM-Instanz(en)
var geo = require('../lib/foodhood_geo.js');

//Liefert Hyperlinks auf alle im System vorhandenen Benutzer
app.get('/',function(req,res){

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            var benutzercollection=[];

            lib.findCollection('benutzer',function(result){

                result.forEach(function(entry){
                    benutzercollection.push(lib.generateLink("benutzer",entry.id));
                });

                res.status(200).json(benutzercollection).end();  
            });
            break;

        default:
            res.status(406).end();
    }
});

//Liefert eine Repräsentation eines Benutzers 
app.get('/:BenutzerId',function(req,res){

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            var params={
                id:Number(req.params.BenutzerId)
            }

            lib.findDocument('benutzer',params,function(result){

                if(result){
                    res.status(200).json(result).end();
                }
                else{
                    res.status(404).end();
                }
            });
            break;

        default:
            res.status(406).end();
    }
});

/* Fügt der Benutzercollection einen neuen Benutzer hinzu und 
*  generiert einen Platzhalter für die Benutzer-Subressource "Situation" 
*  Ordnet den Benutzer nach seinem Wohnort einer Distributionsgruppe zu 
*/
app.post('/',function(req,res){

    lib.checkContent(req,res);

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":
            console.log("Benutzerressource connected to the server");

            //Generiere fortlaufende ID 
            lib.getNextSequence("benutzerid",function(id){ 

                //Wenn ein Benutzer angelegt wird erzeugt das System eine "Situation"-Subressource dieses Benutzers 
                var situation={
                    id:id
                }

                //Füge Situationsdokument in DB ein 
                lib.insertDocument("situationen",situation,function(){

                });

                //Füge den Benutzer der Distributionsgruppe mit ID=PLZ hinzu
                var PLZ = req.body.card.address['postal-code'];

                //Existiert bereits eine Gruppe in diesem PLZ-Bereich? 
                var searchParams={
                    "id":Number(PLZ)
                }

                lib.findDocument('distributionsgruppen',searchParams,function(result){

                    if(result){
                        var GruppenUpdateParams= { 
                            $push: { Mitglieder : lib.generateLink('benutzer',id) } 
                        }

                        //Ordne den Benutzer einer Distributionsgruppe zu 
                        lib.updateDocument('distributionsgruppen',searchParams,GruppenUpdateParams,function(){

                        });
                    }
                    else{

                        var gruppe= {
                            "Mitglieder":[lib.generateLink('benutzer',id)],
                            "id":Number(PLZ)
                        }

                        //Ordne den Benutzer einer Distributionsgruppe zu 
                        lib.insertDocument('distributionsgruppen',gruppe,function(result){

                        });
                    }
                });

                //Füge generierte ID in Benutzerrepräsentation ein 
                var benutzerobject = req.body; 
                benutzerobject.id=id;

                //Füge Datensatz in die Collection aller benutzer ein 
                lib.insertDocument("benutzer",benutzerobject,function(){

                    //Antworte mit eingefügter Repräsentation 
                    res.status(201).set("Location",lib.generateLink('benutzer',id)).json(benutzerobject).end();  
                });
            });
            break;

        default:
            res.status(406).end();
    }
});

/*Ändert die Information des Benutzers mit {BenutzerId},
  Es wird keine dem PATCH-Verb vollständig angemessene Stuktur implementiert, 
  ein Update auf dieser Ressource bildet lediglich eine "replace"-Operation 
  der im Body definierten Attribute ab. Da aber kein absolutes Update möglich sein soll wird 
  PATCH statt PUT verwendet.
*/
app.patch('/:BenutzerId',function(req,res){

    //Prüfe ob Contenttype der Anfrage verarbeitet werden kann 
    lib.checkContent(req,res);

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            var searchparams={
                "id":Number(req.params.BenutzerId)
            }
            async.waterfall([

                //Check ob der Benutzer existiert 
                function(callback){

                    lib.findDocument('benutzer',searchparams,function(result){
                        if(result){
                            callback();
                        }
                        else{
                            res.status(404).end();
                        }
                    });

                    //Update der Benutzerressource 
                },function(callback){

                    var updateparams={
                        $set: { 
                            "card.address": req.body.card.address, 
                            "card.geo": req.body.card.geo,
                            "card.email.value" : req.body.card.email.value,
                            "card.familyname":req.body.card.familyname,
                            "card.wiederkehrendetermine":req.body.wiederkehrendetermine,
                            "verantwortlichkeiten":req.body.verantwortlichkeiten
                        }
                    }

                    lib.updateDocument('benutzer',searchparams,updateparams,function(result){
                        res.status(200).json(result).end();
                    });
                }
            ]);
            break;

        default:
            res.status(406).end();
    }
});

/*
Entfernt einen Benutzer aus dem System, löscht ebenfalls die Subressource 
"Situation"
*/
app.delete('/:BenutzerId',function(req,res){

    var params={
        "id":Number(req.params.BenutzerId)
    }

    async.parallel([

        //benutzer-Ressource löschen 
        function(callback){
            lib.deleteDocument('benutzer',params,function(success){
                if(success){
                    res.status(204).end();
                }
                else{
                    res.status(404).end();
                }
            });
        },

        //Subressource "Situation" löschen 
        function(callback){
            lib.deleteDocument('situationen',params,function(success){

            });
        }
    ]);
});

/*
* Ändert die letzte bekannte Situation des Benutzers, 
* Da nur absolute Änderungen möglich sind wird das PUT-Verb verwendet.
* Die Information über die (Forbewegungs;- und Standort;-) Situation 
* wird in der Anwendungslogik verwendet um passende Vorschläge zur Teilnahme 
* an Spendensammel;- und Transportaktionen zu finden. 
*/
app.put('/:BenutzerId/Situation',function(req,res){

    lib.checkContent(req,res);

    //Headerfeld Accept abfragen
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            //Id aus RequestParams extrahieren 
            var id = Number(req.params.BenutzerId);

            async.waterfall([

                //Existiert der Benutzer mit dieser Id?
                function(callback){

                    var searchparams={
                        "id":id  
                    }

                    lib.findDocument('benutzer',searchparams,function(result){
                        if(result){
                            callback();
                        }

                        else{
                            res.status(404).end();
                        }
                    });
                },

                //Benutzer (Oberressource) existiert, aktualisiere seine Situation 
                function(callback){

                    //Id in die Repr. einfügen 
                    req.body.id= id ; 

                    //Link zur Subressource Vorschlaege einfügen 
                    req.body.sammelaktionen=lib.generateLink("sammelaktionsvorschlaege",id);

                    //Parameter zum Auffinden des richtigen Datensatzes 
                    var searchparams={
                        "id":id
                    }

                    //Absolutes Update durchführen 
                    lib.replaceDocument("situationen",searchparams,req.body,function(result){
                        //inspect(result);
                        res.status(200).json(result).end(); 
                    });
                }
            ]);
            break;

        default:
            res.status(406).end();
    }
});


/*Liefert eine Collection von Transportaktionen die für die 
  Super-Ressource "Situation" angemessen sind und somit vom Benutzer in 
  seiner aktuellen Situation durchführbar wären.
*/
app.get('/:BenutzerId/Situation/Transportaktionen',function(req,res){

    // 1) ermittle Standort des Benuters 

    //Headerfeld Accept abfragen
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){

        case "application/json":
            var id =Number(req.params.BenutzerId);

            var searchparams={
                "id":id
            }

            async.waterfall([

                //Gibt es einen Benutzer mit dieser ID?     
                function(callback){

                    lib.findDocument('benutzer',searchparams,function(result){
                        if(result){
                            console.log("Check ob der Benutzer existiert war erfolgreich");
                            //inspect(result);
                            callback(null,result);
                        } else{
                            res.status(404).end();
                        }
                    });
                },

                //Ist seine letzte Situation bekannt?
                function(result,callback){

                    lib.findDocument('situationen',searchparams,function(situation){
                        if(situation){
                            console.log("Abfrage der letzten bekannten Situation");
                            //inspect(result);
                            callback(null,situation);
                        } else{
                            res.status(404).end();
                        }
                    });
                },

                //Extrahiere Standort aus der Situation und ermittle in welchem PLZ Bereich dieser Standort sich befindet 
                function(situation,callback){

                    //Wenn schon eine Situation bekannt ist (der vom Server generierte Platzhalter mit PUT verändert wurde 
                    if(situation.startstandort){

                        //inspect(result);
                        var latitudeStartstandort = situation.startstandort.latitude;
                        var longitudeStartstandort = situation.startstandort.longitude;

                        //Geocode den Standort und ermittle den PLZ-Bereich 
                        geocoder.reverseGeocode(latitudeStartstandort,longitudeStartstandort,function(err,data){

                            if(err){
                                res.status(500).end();
                            }

                            else{
                                //Ziehe den postal code aus der Antwort des Geocoders, dieser geocoder nutzt die Google Maps API 
                                var standortPlz=data.results[0].address_components[data.results[0].address_components.length-1].long_name;
                                console.log("Ein Benutzer ruft Teilnahmevorschläge ab, sein Standort liegt in Postleitzahl" + standortPlz);
                                callback(null,standortPlz,situation); 
                            }
                        });
                    }

                    //Ansonsten kann kein Inhalt geliefert werden 
                    else{
                        res.status(204).end();
                    }

                    //Finde für diesen Bereich zuständigen Tafelverein 
                },function(standortPlz,situation,callback){

                    var searchParams={
                        zustaendigkeiten: Number(standortPlz)
                    }

                    lib.findDocuments('tafelvereine',searchParams,function(err,zustaendigeTafeln){
                        callback(null,standortPlz,situation,zustaendigeTafeln);
                    });

                    //Finde Lagerorte, bei denen die Spenden alternativ abgegeben werden können
                },function(standortPlz,situation,zustaendigeTafeln,callback){

                    var searchParams={
                        "card.address.postal-code":Number(standortPlz)
                    }

                    lib.findDocuments('lagerorte',searchParams,function(err,moeglicheLagerorte){
                        callback(null,standortPlz,zustaendigeTafeln,situation,moeglicheLagerorte);
                    });

                    //Berechne Abstände zwischen den Spenden, den Lagerorten und dem Tafelverein 
                    //Stelle sicher,dass eine Transportaktion die Spende stets näher zum Tafelverein 
                    //transportiert 
                },function(standortPlz,situation,zustaendigeTafeln,moeglicheLagerorte,callback){

                    //Nicht fertig geworden 
                    res.status(501).end();

                    //Stelle Transportroutenrepräsentation zusammen 
                },function(callback){

                }],function(err,result){

                if(result){
                    res.json(result).end();
                }
            });
    }
});

/*Liefert eine Collection von Sammel;- und Transportaktionen die für die 
  Super-Ressource "Situation" angemessen sind und somit vom Benutzer in 
  seiner aktuellen Situation durchführbar wären.
*/
app.get('/:BenutzerId/Situation/Sammelaktionen',function(req,res){

    //Headerfeld Accept abfragen
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){

        case "application/json":

            var id =Number(req.params.BenutzerId);
            var searchparams={
                "id":id
            }

            async.waterfall([

                //Gibt es einen Benutzer mit dieser ID?     
                function(callback){

                    lib.findDocument('benutzer',searchparams,function(result){
                        if(result){
                            console.log("Check ob der Benutzer existiert war erfolgreich");
                            inspect(result);
                            callback(null,result);
                        } else{
                            res.status(404).end();
                        }
                    });

                },

                //Ist seine letzte Situation bekannt?
                //Situationsressourcen werden beim POST auf den Benutzer angelegt, sollte keine existieren ist dies 
                //Ein fehler des Servers 
                function(result,callback){

                    lib.findDocument('situationen',searchparams,function(result){
                        if(result){
                            console.log("Abfrage der letzten bekannten Situation");
                            inspect(result);
                            callback(null,result);
                        } else{
                            res.status(500).end();
                        }
                    });

                },

                //Extrahiere Standort aus der Situation und ermittle in welchem PLZ Bereich dieser Standort sich befindet 
                function(result,callback){

                    //Wenn schon eine Situation bekannt ist (der vom Server generierte Platzhalter mit PUT verändert wurde 
                    if(result.startstandort){

                        //inspect(result);
                        var latitudeStartstandort = result.startstandort.latitude;
                        var longitudeStartstandort = result.startstandort.longitude;

                        //Geocode den Standort und ermittle den PLZ-Bereich 
                        geocoder.reverseGeocode(latitudeStartstandort,longitudeStartstandort,function(err,data){

                            if(err){
                                res.status(500).end();
                            }

                            else{
                                //Ziehe den postal code aus der Antwort des Geocoders, dieser geocoder nutzt die Google Maps API 
                                var standortPlz=data.results[0].address_components[data.results[0].address_components.length-1].long_name;
                                console.log("Ein Benutzer ruft Teilnahmevorschläge ab, sein Standort liegt in Postleitzahl" + standortPlz);
                                callback(null,standortPlz,result); 
                            }
                        });
                    }

                    //Ansonsten kann kein Inhalt geliefert werden 
                    else{
                        res.status(204).end();
                    }
                },

                //Finde Angebote die in dem Zeitfenster liegen, dass die Situationsanalyse durch Abgleich mit den Terminen des 
                //Benutzers ermittelt hat 
                function(standortPlz,situation,callback){    

                    //Finde Angebote in PLZ, die noch Teil keiner Aktion sind           
                    var searchparamsPLZ={
                        "standort.postal-code":standortPlz,
                        "status":"nicht_zugewiesen"
                    }

                    lib.findDocuments('angebote',searchparamsPLZ,function(result){

                        //Es gibt keine Angebote in diesem PLZbereich, der Abruf war dennoch erfolgreich
                        if(result.length==0){
                            res.status(204).end();
                        }

                        //Filtere Angebote die Abholtermine im gegebenen Zeitfenster haben
                        else{

                            //Filtere die Uhrzeit aus der Situationsrepräsentation
                            var fruehesterTermin = new Date(situation.startzeitpunkt);

                            inspect(fruehesterTermin);

                            //Prüfe ob ein Endzeitpunkt definiert wurde und ob dieser nach dem Startzeitpunkt liegt 
                            var spaetesterTermin = new Date(situation.endzeitpunkt);

                            inspect(spaetesterTermin);

                            //Bilde einen Zeitraum mit moment-range.js, dieser Zeitraum ist das Zeitfenster in dem der Sammler Zeit hat Angebote abzuholen
                            var situationsZeitraum=moment.range(fruehesterTermin,spaetesterTermin);

                            //Array mit Angeboten die einen passenden Termin haben 
                            var angeboteMitPassendenAbholterminen=[];

                            //Array um aus den Geolocations der Angebote später die Distance-Tabelle von OSRM abfragen zu können 
                            var angebotsGeolocations = [];

                            //Pushe den aktuellen Standort als erstes Element in die Locations, da dieser Standort der Start für die Berechnung 
                            //des kürzesten Weges mit dem Dijkstra Algorithmus darstellen soll. Es muss eine solche Darstellung erzeugt 
                            //werden um einen passenden Request an OSRM stellen zu können 
                            angebotsGeolocations.push([situation.startstandort.latitude,situation.startstandort.longitude]);

                            //Um später ohne Suchen zu müssen das zu einer geolocation gehörende Angebot zu finden wird auch zu den Angeboten ein 
                            //Element hinzugefügt , so ist Index 1 des AngebotsArrays == Index 1 des GeolocationArrays 
                            angeboteMitPassendenAbholterminen.push({
                                geolocation:{
                                    latitude:situation.startstandort.latitude,
                                    longitdue:situation.startstandort.longitude
                                }
                            });

                            //Iteriere über alle Angebote 
                            for(var i=0;i<result.length;i++){

                                //Flag das verhindern soll das Angebote mehrfach als "für eine Sammelaktion in Frage kommend" gelistet werden, 
                                //Da Angebote mehrere Abholtermine besitzen können 
                                var angebotBereitsGelistet = false;

                                //Lege eine Datenstrutur für die Zeiträume an, bei denen Zeitraum aus der Situation und 
                                //Abholtermin Schnittmengen haben 
                                result[i].moeglicheAbholzeiten=[];

                                //Iteriere für jedes Angebot durch die Möglichen Abholtermine
                                for(var j=0;j<result[i].abholtermine.length;j++){

                                    //Extrahiere Zeitraum möglicher Durchführung von Aktionen  
                                    var abholZeitraumStart=new Date(result[i].abholtermine[j].von);
                                    var abholZeitraumEnde=new Date(result[i].abholtermine[j].bis);
                                    var abholzeitraum = moment.range(abholZeitraumStart,abholZeitraumEnde);

                                    //Falls es eine Überschneidung in den Zeiträumen gibt  
                                    if(situationsZeitraum.overlaps(abholzeitraum)){

                                        //Finde den Zeitraum in dem sich abholzeitraum und situationszeitraum überschneiden
                                        var ueberschneidungszeitraum=situationsZeitraum.intersect(abholzeitraum);

                                        //Füge den Gefundenen Termin in die Angebotsrepräsentation ein 
                                        result[i].moeglicheAbholzeiten.push({von: ueberschneidungszeitraum.start._i,
                                                                             bis: ueberschneidungszeitraum.end._i});

                                        if(!angebotBereitsGelistet){

                                            angebotsGeolocations.push([result[i].geolocation.lat,result[i].geolocation.lng]);

                                            //Es wurde ein zeitlich passender Termin gefunden, nimm das Angebot zu dem er gehört in die Liste auf 
                                            angeboteMitPassendenAbholterminen.push(result[i]);

                                            //Verhindere das dieses Angebot nocheinmal in die Liste passender Angebote gelangt
                                            angebotBereitsGelistet=true;
                                        }
                                    }
                                }
                            }   
                        }

                        //console.log("Das Gewicht dieser Angebote beträgt");
                        //inspect(spendengewicht_in_plz);

                        //console.log("Die Locations der gefundenen Angebote");
                        //inspect(angebotsGeolocations);
                        callback(null,angeboteMitPassendenAbholterminen,angebotsGeolocations,situation);

                    });

                    //Stelle Anfrage an OSRM zum erhalt des Distance Tables, der Distanzen (genauer "Traveltime" in sekunden) zwischen allen gefundenen Angeboten 
                    //beinhaltet
                },function(angeboteMitPassendenAbholterminen,angebotsGeolocations,situation,callback){

                    //console.log("ANGEBOTE MIT PASSENDEN ABHOLTERMINEN");
                    //inspect(angeboteMitPassendenAbholterminen);

                    //Es konnte kein Angebot gefunden werden , keine Routenberechnung o.Ä notwendig 
                    if(angeboteMitPassendenAbholterminen.length==1){
                        res.status(204).end();
                    }

                    else{
                        //Setzte passenden Query-String aus den Geolocations zusammen 
                        geo.getOsrmQueryString(angebotsGeolocations,"table",function(err,osrmQueryString){

                            //console.log("QUERYSTRING FÜR DEN DISTANCETABLE AUS DIESEN ANGEBOTEN");
                            //inspect(osrmQueryString);

                            //Frage eine Distance-Tabelle bei OSRM ab
                            geo.getOsrmDistanceTable(osrmQueryString,function(err,osrmDistanceTable){

                                callback(null,osrmDistanceTable,situation,angebotsGeolocations,angeboteMitPassendenAbholterminen);
                            });
                        });
                    }

                    //Wende eine Variation des Dijkstra-Algorithmus mithilfe der Distanzmatrix an, der die 
                    //Postion, Reichweite und Transportkapazität des anfragenden Benutzers ("Situtationsparameter")
                    //berücksichtigt um aus den Angeboten die terminlich in Frage kommen 
                    //eine Transportroute vorzuschlagen 
                },function(distanceTable,situation,angebotsGeolocations,angeboteMitPassendenAbholterminen,callback){


                    dijkstraMitSpendenGewichtsObergrenze(distanceTable,situation,angebotsGeolocations,angeboteMitPassendenAbholterminen,function(err,shortestPath,gesamtGewicht){

                        //Einziges Element im Ergebnis ist der vorher gepushte Startstandort 
                        if(shortestPath.length == 1){
                            res.status(204).end();
                        }

                        else{
                            callback(null,shortestPath,angeboteMitPassendenAbholterminen,gesamtGewicht);
                        }
                    });

                    //Der Algorithmus liefert eine Darstellung, die von OSRM verarbeitet werden kann. Da aber auch 
                    //Einige Details der gefundenen Angebote selbst (@param angeboteDieSituationsConstraintsBeachten) 
                    //in die Repräsentation einer Sammelaktion gelangen sollen werden sie im async-Waterfall ständig
                    //weitergereicht
                },function(kuerzesterPfad,angeboteDieSituationsConstraintsBeachten,gesamtGewicht,callback){

                    //Baue Querystring für einen "viaRoute" Request an OSRM
                    geo.getOsrmQueryString(kuerzesterPfad,"viaroute",function(err,osrmQueryString){

                        //inspect("Querystring für die Routinganfrage an OSRM: "+ osrmQueryString);

                        //Compression wird in der Zukunft sehr sinnvoll sein, ist aber zu Testzwecken eher hinderlich 
                        osrmQueryString=osrmQueryString.concat("&compression=false");

                        //Frage Routinginformation an 
                        geo.getOsrmRoute(osrmQueryString,function(err,routingInformation){

                            //inspect(routingInformation);

                            //Setze Sammelaktionsrepräsentation zusammen
                            var sammelaktion={
                                status:"not_done",
                                streckenlaenge:routingInformation.route_summary.total_distance,
                                fortbewegungsmittel:'car',
                                dauer:routingInformation.route_summary.total_time,
                                gesamtgewicht:gesamtGewicht,
                                zielstandort:null,
                                sammler:lib.generateLink('benutzer',req.params.BenutzerId),
                                route:[],
                                routegeometry:routingInformation.route_geometry
                            }

                            //Pushe Links auf alle Angebote in die Sammelaktionsrepräsentation 
                            async.each(angeboteDieSituationsConstraintsBeachten,function(item,next){    

                                //Die Geolocaiton an index 0 und unpassende Angebote verfügen nicht über ein Attribut "passnederTermin" und wird übersprungen
                                //Alle anderen Angebote werden in die Sammelaktionsrepräsentation eingebaut
                                if(item.passenderTermin){
                                    sammelaktion.route.push({
                                        angebot:lib.generateLink('angebot',item.id),
                                        moeglicheAbholtermine:item.moeglicheAbholzeiten,
                                        geolocation:item.geolocation,
                                        geschaetzteAnkunftszeit:item.geschaetzteAnkunftszeit,
                                        passenderTermin:item.passenderTermin
                                    });
                                    //inspect(sammelaktion);
                                }
                                next();

                            },function(err,result){

                                callback(null,sammelaktion);
                            });
                        });
                    });
                }
            ], function (err, result) {

                res.status(200).json(result).end();
            });
            break;

        default:
            res.status(406).end();
    }
});

/*
* Abwandlung des Dijkstra-Algorithmus (siehe Repository "MS6/Implementation/Dienstgeber/tests/Dijkstra Tests
* @param distanceMatrix - OSRM Distanzmatrix ( https://github.com/Project-OSRM/osrm-backend/wiki/Server-api ) 
* Der OSRM-Server wird selbst gehostet, der request geht daher an localhost auf Port 5000. */
function dijkstraMitSpendenGewichtsObergrenze(distanceMatrix,situation,angebotsGeolocations,angebote,callback){

    /*Vorgehen bei diesem Algorithmus:
    *   PRECONDTION : Es sind Angebote mit Abholterminen in einem bestimmten Zeitfesnter bekannt. 
    *                 Es wurden alle relevanten Geolocations (Benutzerstandort + Angebotsstandorte) mithilfe von OSRM in einer Distanz-Tabelle
    *                 verknüpft 
    *
    *   1. Füge den aktuellen Standort des Benutzers als Startpunkt der Route ein 
    *   2. Markiere diesen Knoten als bereits in Route 
    *   3. DIJKSTRA - Von einem Startknoten aus 
    *       3.1 Betrachte alle ausgehenden Kanten und finde jenen mit minimaler Distanz zum Standort
    *       3.2 Prüfe ob das gefundene Minimum(die Spende die am nächsten am Standort ist) das Transportgewicht oder die Reichweiteneinschränkung des Benutzers übersteigen würde 
    *           Wenn JA
    *               Ignoriere dieses Angebot
    *
    *           Wenn NEIN
    *               3.3 Kann das gefundene Angebot zu einem Zeitpunkt erreicht werden an dem ein Abholtermin verfügbar ist?
    *                   WENN JA 
    *                       Merke den Termin , Ankunftszeitpunkt und das Angebot
    *                       Fahre am neuen Standort fort 
    *                   WENN NEIN 
    *                       Ignoriere dieses Angebot
    *
    */

    //console.log("Die Gewichtsobergenze zur Verknüpfung der Angebote beträgt:");
    //inspect(spendenGewichtsObergrenze);

    //console.log("Angebote in der Dijkstrafunktion, es wurden " + angebote.length-1 + " Angebote gefunden");
    //inspect(angebotsGeolocations);

    //inspect(angebote);

    //Kürzeste Abarbeitungsreihenfolge 
    var route = [];

    //Zähler für die Stationen , die bereits in der Route eingefügt wurden
    var aktuelleAnzahlStationenDerRoute=0;

    //Gesamtlänge der kürzesten Stecke zwischen den Angeboten
    var aktuelleGesamtStreckenlaenge=0;

    //Wir beginnen beim Startknoten, xIndex = yIndex = 0 in der distancematrix 
    var startknotenIndex = 0;

    //Index des Knotens an dem ein Minimum gefunden wurde
    var IndexOfMinimum = 0;

    //Summe aller Spendengewichte entlang der Route 
    var bisherigesSpendengewicht=0;

    //Gefundener kürzester Weg
    var minDistance = Infinity;

    //Markierung für bereits gefundene Knoten 
    var KNOTEN_BEREITS_IN_ROUTE=-1;

    //Laenge der fertigen Route wird als Bestandteil der Abbruchbedingung genutzt 
    var LAENGE_DER_FERTIGEN_ROUTE=distanceMatrix.length;

    //Ein Puffer der für die Uebergabe einzelner Lebensmittelspenden bei der Abholtung eingerechnet wird 
    var UEBERGABEPUFFER_IN_SEKUNDEN=300; // 5 min

    //Liefert die Anzahl Sekunden die seit dem 1.1.1970 bis zum startzeitpunkt verstrichen sind
    //experimente mit der Konvertierung von Datetimestring : https://jsfiddle.net/rf444xpg/ 
    var startzeitpunkt = new Date(situation.startzeitpunkt).getTime();
    startzeitpunkt = startzeitpunkt / 1000;

    var endzeitpunkt = new Date(situation.endzeitpunkt).getTime();
    endzeitpunkt = endzeitpunkt / 1000;

    //der erste Standort der Route ist der aktuelle Standort des Benutzers, der im vorigen Schritt zu den Angebotslocations gefügt wurde
    route.push(angebotsGeolocations[0]);

    //Markiere den Startknoten
    markiereKnotenSync(distanceMatrix,0,KNOTEN_BEREITS_IN_ROUTE);

    //console.log("Vor Beginn der Suche sieht die Distanzmatrix folgendermaßen aus: ");
    //inspect(distanceMatrix);

    //Bis alle Knoten in die Route eingebaut sind 
    while(aktuelleAnzahlStationenDerRoute < LAENGE_DER_FERTIGEN_ROUTE-1){

        //Betrachte Kanten zu allen anderen , noch nicht bearbeiteten Knoten 
        for(var k=0;k<LAENGE_DER_FERTIGEN_ROUTE;k++){

            //Distanzen entlang der Hauptdiagonale der Distanzmatrix sind = 0(Distanz eines Knotens zu sich selbst) und müssen nicht betrachtet werden 
            //Bereits in der Route eingebaute Knoten werden mit einer Konstante markiert und ebenfalls ausgeschlossen  
            if(k != startknotenIndex && distanceMatrix[startknotenIndex][k] != KNOTEN_BEREITS_IN_ROUTE){

                //Ist die Distanz zu diesem Knoten kleiner als die bisher bekannte Mindestdistanz?
                if(distanceMatrix[startknotenIndex][k] < minDistance ){

                    //Merke kleinste Distanz
                    minDistance=distanceMatrix[startknotenIndex][k];

                    //Den Knoten an dem das Minimum gefunden wurde merken 
                    IndexOfMinimum=k;
                }
            }
        }

        //Ist die Gewichtsgrenze sowie die Transportreichweite bei hinzufügen des gefundenen Angebots eingehalten?
        //Wenn Ja:  
        if( angebote[IndexOfMinimum].gewicht + bisherigesSpendengewicht <= situation.transportgewicht && 
           minDistance + aktuelleGesamtStreckenlaenge <= situation.reichweite){

            //Der Ankunftszeitpunkt beim Angebotsstandort 
            ankunftszeitpunkt = startzeitpunkt + distanceMatrix[startknotenIndex][IndexOfMinimum];

            //Kann das ermittelte Ziel noch innerhalb des angegeben Zeitraums erreicht werden?
            if(ankunftszeitpunkt <= endzeitpunkt){

                //Finde heraus ob zum Ankunftszeitpunkt bei diesem Knoten ein Termin verfügbar wäre 
                findeMatchendenTermin(angebote[IndexOfMinimum],ankunftszeitpunkt*1000,function(termin){

                    inspect(termin);

                    //Es gibt zum Ankunftszeitpunkt einen Termin 
                    if(termin){

                        //Merke den Termin 
                        angebote[IndexOfMinimum].passenderTermin = termin;

                        //Beim nächsten Durchlauf wird die letzte Startzeit + Traveltime zum gefundenen Ziel als Startzeit verwendet.  
                        startzeitpunkt = startzeitpunkt + distanceMatrix[startknotenIndex][IndexOfMinimum];

                        //Gleichzeitig ist dieser Zeitpunkt der Ankunftszeitpunkt bei sofortigem Start der Aktion 
                        angebote[IndexOfMinimum].geschaetzteAnkunftszeit =new Date(startzeitpunkt*1000);

                        //Dauer einer Spendenübergabe (Sammler muss an der Tür klingeln, es folgt vermutlich ein kurzes Gespräch zwischen Sammler und Anbieter) einberechnet
                        startzeitpunkt= startzeitpunkt + UEBERGABEPUFFER_IN_SEKUNDEN;

                        //Rechne das Gewicht der Spende an diesem Standort auf das aktuelle Spendengewicht 
                        bisherigesSpendengewicht += angebote[IndexOfMinimum].gewicht;

                        //Rechne das Teilstück auf die Gesamtlaenge
                        aktuelleGesamtStreckenlaenge+=minDistance;

                        //Füge die Koordinaten des Angebots in die Route ein
                        route.push(
                            angebotsGeolocations[IndexOfMinimum]
                        );
                    }

                    //Der nächste durchlauf beginnt beim gefundenen Minimum, ansonsten 
                    //wird der letzte betrachtete Knoten noch einmal betrachtet, mit dem Unterschied 
                    //das eine Option geblockt wurde 
                    startknotenIndex = IndexOfMinimum;
                });
            }
        }

        aktuelleAnzahlStationenDerRoute++;

        //Der gefundene Knoten wird nicht mehr berücksichtigt werden, da sein Spendengewicht zu hoch ist 
        //oder er bereits in die Route aufgenommen wurde , oder es zu Ankunftszeitpunkt keinen Termin gab 
        //markiere die Spalte des Betrachteten Knotens als "BEREITS IN ROUTE"
        markiereKnotenSync(distanceMatrix,IndexOfMinimum,KNOTEN_BEREITS_IN_ROUTE);

        //minDistance zurücksetzen 
        minDistance=Infinity;

        //inspect(route);
        //inspect(distanceMatrix);
        //console.log("nächster Startknotenindex " + startknotenIndex);
    }

    //console.log("Der kürzeste Pfad, wenn mit Knoten an Index[0][0] begonnen werden soll");
    //inspect(sammelaktion.route);
    callback(null,route,bisherigesSpendengewicht);
}


/* Prüft ob ein Zeitpunkt in einem von ggf. mehreren Abholterminen 
*  eines Angebots liegt. 
*  @returns gefundenen Zeitraum {von: <datetimestring> bis:<datetimestring>} ,falls Termin gefunden 
*  @returns null , wenn kein Termin gefunden wurde 
*/
function findeMatchendenTermin(angebot,zeitpunkt,callback){

    console.log("Terminmatcher aufgerufen mit angebot :");
    inspect(angebot);

    console.log("Und Zeitpunkt");
    inspect(new Date(zeitpunkt));

    var zuPrüfenderTermin = moment(new Date(zeitpunkt));
    var abholzeitraumStart;
    var abholzeitraumEnde;
    var TERMIN_NOT_FOUND=-1;

    var terminIndex=TERMIN_NOT_FOUND;

    //Laufindex für Termine
    var i=0;

    async.each(angebot.moeglicheAbholzeiten,function(abholzeitraum,next){    

        abholzeitraumStart = new Date(angebot.moeglicheAbholzeiten[i].von);
        abholzeitraumEnde = new Date(angebot.moeglicheAbholzeiten[i].bis);
        var abholzeitraum = moment.range(abholzeitraumStart,abholzeitraumEnde);

        //Wenn der Ankunftszeitpunkt innerhalb des gefundenen Terminzeitraums liegt 
        if(abholzeitraum.contains(zuPrüfenderTermin)){

            console.log("termin gefunden");

            //Merke index des Termins
            terminIndex = i;
        }
        else{
            console.log("kein termin gefunden");
        }
        i++;
        next();

    },function(err,result){    

        if(terminIndex != TERMIN_NOT_FOUND){

            //Baue einen Zeitraum zusammen der von dem Prüfzeitpunkt bis ende des Termins geht 
            callback({
                von:new Date(zeitpunkt),
                bis:angebot.moeglicheAbholzeiten[terminIndex].bis
            });
        }
        else{
            callback(null);
        }
    });
}

function markiereKnotenSync(distanceMatrix,knotenIndex,KNOTEN_BEREITS_IN_ROUTE_MARKIERUNG){

    //Markiere diesen Standort als Bereits eingebaut 
    for(var i=0;i<distanceMatrix.length;i++){
        distanceMatrix[i][knotenIndex] = KNOTEN_BEREITS_IN_ROUTE_MARKIERUNG;
    }
    return;
}

module.exports = app;