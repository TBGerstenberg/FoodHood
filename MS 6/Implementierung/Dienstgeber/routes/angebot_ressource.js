var app = express.Router();

//Eigene kleine Libary zur Auslagerung wiederkehrender Aufgaben
var lib = require('../lib/foodhood_db.js');

//Wrapper für Anfragen an OSRM und Geocoding mit dem Geocode-Modul 
var geo = require('../lib/foodhood_geo.js');

/* Liefert Hyperlinks auf alle im System vorhandenen Angebote*/
app.get('/',function(req,res){

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            var angebotcollection=[];

            lib.findCollection('angebote',function(result){

                result.forEach(function(entry){
                    angebotcollection.push(lib.generateLink("angebot",entry.id));
                });

                res.status(200).json(angebotcollection).end();  
            });
            break;

        default:
            res.status(406).end();
    }
});

//Liefert eine Repräsentation eines Angebots 
app.get('/:AngebotId',function(req,res){

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            var params={
                id:Number(req.params.AngebotId)
            }

            lib.findDocument('angebote',params,function(result){

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

/*Ändert die Information des Angebots mit {AngebotId},
  Es wird keine dem PATCH-Verb vollständig angemessene Stuktur implementiert, 
  ein Update auf dieser Ressource bildet lediglich eine "replace"-Operation 
  der im Body definierten Attribute ab. Da aber kein absolutes Update möglich sein soll wird 
  PATCH statt PUT verwendet.
*/
app.patch('/:AngebotId',function(req,res){

    //Prüfe ob Contenttype der Anfrage verarbeitet werden kann 
    lib.checkContent(req,res);

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            var searchparams={
                "id":Number(req.params.AngebotId)
            }

            var updateparams={
                $set: { 
                    "abholtermine":req.body.abholtermine,
                    "status":req.body.status,
                    "anbieter":req.body.anbieter,
                    "beschreibung":req.body.beschreibung,
                    "status":req.body.status
                }
            }

            lib.updateDocument('angebote',searchparams,updateparams,function(result){
                res.status(200).json(result).end();
            });
            break;

        default:
            res.status(406).end();
    }
});

/* Fügt der Angebotscollection einen neues Angebot hinzu, Falls für dieses 
Angebot keine Geolocation angegeben wurde wird diese Anhand der Addressdaten 
ermittelt. Dies hat den Hintergrund ,dass zur Berechnung von Sammelaktionsrouten kein 
Geocoding mehr durchgeführt werden muss, wenn die Standorte der Angebote bereits bekannt sind.*/
app.post('/',function(req,res){

    lib.checkContent(req,res);

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":
            console.log("Angebotressource connected to the server");

            //Generiere fortlaufende ID 
            lib.getNextSequence("angebotid",function(id){ 

                //Wenn die Repräsentation keine geolocation enthält, Führe ein Geocoding durch  und ermittle die 
                //Koordinaten der Adresse
                if(!req.body.geolocation){

                    // Das Geocoding Modul setzt auf Google Maps auf und verwendet Stringrepräsentationen 
                    // als Geocodingparameter
                    // House Number, Street Direction, Street Name, Street Suffix, City, State, Zip, Country 
                    var geoCodeAddressString=req.body.standort['street-address'] + req.body.standort['postal-code'];

                    //Löse Adreese in Geolocation auf ,um diesen Schritt nicht bei der Berechnung von 
                    //Sammelaktionen u.Ä durchführen zu müssen 
                    geo.geocode(geoCodeAddressString,function(err,LatLngPair){

                        //Füge generierte ID in Angebotsrepräsentation ein 
                        var angebotobject = req.body; 
                        angebotobject.id=id;
                        angebotobject.geolocation=LatLngPair;

                        //Füge Datensatz in die Collection aller Angebote ein 
                        lib.insertDocument("angebote",angebotobject,function(){

                            //Antworte mit eingefügter Repräsentation 
                            res.status(201).json(angebotobject).end();  
                        });
                    });
                }

                else{
                    //Füge generierte ID in Angebotsrepräsentation ein 
                    var angebotobject = req.body; 
                    angebotobject.id=id;
            
                    //Füge Datensatz in die Collection aller Angebote ein 
                    lib.insertDocument("angebote",angebotobject,function(){

                        //Antworte mit eingefügter Repräsentation 
                        res.set("Location",lib.generateLink('angebot',id)).status(201).json(angebotobject).end();  
                    });
                }
            });
            break;

        default:
            res.status(406).end();
    }
});

/* Entfernt ein Angebot aus dem System */
app.delete('/:AngebotId',function(req,res){

    var params={
        "id":Number(req.params.AngebotId)
    }

    lib.deleteDocument('angebote',params,function(success){
        if(success){
            res.status(204).end();
        }
        else{
            res.status(404).end();
        }
    });
});
module.exports = app;