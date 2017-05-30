//Dieses Script dient dem Einfügen von Testdaten in das System. Da diese Operation in der POST-Operation der jeweiligen 
//Routen definiert ist und man diese Implementierung nicht kopieren wollte werden diese Testdaten 
//ebenfalls mittels HTTP-Requests und mehrfachen POST-Operationen eingefügt. 
//Die Testdaten für Angbeote (besonders relevant für den Test der verteilten Anwendungslogik) beinhalten 
//Test-SPendenangebote rund um den Campus Gummersbach und die Kölner Innenstadt. Abholtermine 
//dieser Angebote werden an das aktuelle Datum und die aktuelle Uhrzeit angepasst. 

var lib = require('../lib/foodhoodlib.js');

var http = require('http');

//eyes modul für farbige Konsolenausgaben , maxlength : false hebt die Depth-level Grenze der Anzeige auf 
var inspect=require('eyes').inspector({maxLength: false});

module.exports = {

    //Fügt eine Reihe von Testangeboten in das System ein 
    insertTestAngebote : function() {
        
        var current_date= new Date();

        var testangebot1 = {
            "gewicht": 1.0,
            "artikelkategorien": [
                "Backwaren"
            ],
            "erstellungsdatum": current_date.toISOString(),
            "standort":{
                "country-name":"Germany",
                "region":"NRW",
                "postal-code":"50668",
                "street-address":"Ursulastraße 9",
                "locality": "Köln"
            },
            "abholtermine": [

            ],
            "geolocation":{
                "lat":50.9448510,
                "lng":6.9597350  
            },
            "enthalteneangebote":[],
            "bild": "voluptas saepe cum",
            "beschreibung": "1 Kg Weißbrot",
            "gueltigkeitsablaufdatum": "2015-12-09T13:00:00.000Z",
            "status":"nicht_zugewiesen",
            "zustanedigetafel":"http://foodhood.org/Tafelverein/23", 
            "anbieter":"http://foodhood.org/Benutzer/1"
        }

        var testangebot2 = {
            "gewicht": 2.5,
            "artikelkategorien": [
                "Getränke und Flüssigwaren"
            ],
            "erstellungsdatum": current_date.toISOString(),
            "standort":{
                "country-name":"Germany",
                "region":"NRW",
                "postal-code":"50668",
                "street-address":"Plankgasse 7",
                "locality": "Köln"
            },
            "abholtermine": [

            ],
            "bild": "voluptas saepe cum",
            "beschreibung": "Flasche Wein, 2l H-Milch",
            "gueltigkeitsablaufdatum": "2949-07-12T02:34:01.035Z",
            "status":"nicht_zugewiesen",
            "zustanedigetafel":"http://foodhood.org/Tafelverein/23", 
            "anbieter":"http://foodhood.org/Benutzer/2",
            "geolocation":{
                "lat":50.946793050,
                "lng":6.9521560 
            },
            "enthalteneangebote":[]
        }

        var testangebot3 = {
            "gewicht": 2.3,
            "artikelkategorien": [
                "Obst und Gemüse"
            ],
            "erstellungsdatum":current_date.toISOString(),
            "standort":{
                "country-name":"Germany",
                "region":"NRW",
                "postal-code":"50668",
                "street-address":"Weidengasse 3"
            },
            "abholtermine": [

            ],
            "bild": "voluptas saepe cum",
            "beschreibung": "Kiste Tomaten",
            "gueltigkeitsablaufdatum": "2015-07-12T02:34:01.035Z",
            "status":"nicht_zugewiesen",
            "zustanedigetafel":"http://foodhood.org/Tafelverein/23", 
            "anbieter":"http://foodhood.org/Benutzer/3",
            "geolocation":{
                "lat":50.9475500,
                "lng":6.95625606
            },
            "enthalteneangebote":[]
        }

        var testangebot4 = {
            "gewicht": 1.1,
            "artikelkategorien": [
                "Obst und Gemüse"
            ],
            "erstellungsdatum": current_date.toISOString(),
            "standort":{
                "country-name":"Germany",
                "region":"NRW",
                "postal-code":"50668",
                "street-address":"Jakordenstraße 10"
            },
            "abholtermine": [

            ],
            "bild": "voluptas saepe cum",
            "beschreibung": "Kartoffeln vom Feld",
            "gueltigkeitsablaufdatum": "2015-12-09T02:34:01.035Z",
            "status":"nicht_zugewiesen",
            "zustanedigetafel":"http://foodhood.org/Tafelverein/23", 
            "anbieter":"http://foodhood.org/Benutzer/3",
            "geolocation":{
                "lat":50.9454590,
                "lng":6.95973506
            },
            "enthalteneangebote":[]
        }
        
        var testangebot5 = {
            "gewicht": 0.5,
            "artikelkategorien": [
                "konserven und fertiggerichte"
            ],
            "erstellungsdatum": current_date.toISOString(),
            "standort":{
                "country-name":"Germany",
                "region":"NRW",
                "postal-code":"50668",
                "street-address":"Johannisstraße 77"
            },
            "abholtermine": [
                
            ],
            "bild": "voluptas saepe cum",
            "beschreibung": "eine Packung Kaffeepulver",
            "gueltigkeitsablaufdatum": "2015-12-09T02:34:01.035Z",
            "status":"nicht_zugewiesen",
            "zustanedigetafel":"http://foodhood.org/Tafelverein/23", 
            "anbieter":"http://foodhood.org/Benutzer/1",
            "geolocation":{
                "lat":50.945858,
                "lng":6.961137
            },
            "enthalteneangebote":[]
        }
        
        var testangebot6 = {
            "gewicht": 1.1,
            "artikelkategorien": [
                "konserven und fertiggerichte"
            ],
            "erstellungsdatum": current_date.toISOString(),
            "standort":{
                "country-name":"Germany",
                "region":"NRW",
                "postal-code":"50668",
                "street-address":"Eintrachtstraße 6"
            },
            "abholtermine": [
                
            ],
            "bild": "voluptas saepe cum",
            "beschreibung": "Eine Packung Spaghetti",
            "gueltigkeitsablaufdatum": "2015-12-09T02:34:01.035Z",
            "status":"nicht_zugewiesen",
            "zustanedigetafel":"http://foodhood.org/Tafelverein/23", 
            "anbieter":"http://foodhood.org/Benutzer/2",
            "geolocation":{
                "lat":50.947378,
                "lng":6.955962
            },
            "enthalteneangebote":[]
        }
        
        var testangebot7 = {
            "gewicht": 0.4,
            "artikelkategorien": [
                "Nudeln und Getreideprodukte"
            ],
            "erstellungsdatum": current_date.toISOString(),
            "standort":{
                "country-name":"Germany",
                "region":"NRW",
                "postal-code":"50668",
                "street-address":"Ritterstraße 28"
            },
            "abholtermine": [
                
            ],
            "bild": "voluptas saepe cum",
            "beschreibung": "Eine Packung Spaghetti",
            "gueltigkeitsablaufdatum": "2015-12-09T02:34:01.035Z",
            "status":"nicht_zugewiesen",
            "zustanedigetafel":"http://foodhood.org/Tafelverein/23", 
            "anbieter":"http://foodhood.org/Benutzer/2",
            "geolocation":{
                "lat": 50.947272,
                "lng": 6.952261
            },
            "enthalteneangebote":[]
        }
        
        var testangebot8 = {
            "gewicht": 0.4,
            "artikelkategorien": [
                "Nudeln und Getreideprodukte"
            ],
            "erstellungsdatum": current_date.toISOString(),
            "standort":{
                "country-name":"Germany",
                "region":"NRW",
                "postal-code":"50679",
                "street-address":"Adolphstraße 7"
            },
            "abholtermine": [
                
            ],
            "bild": "voluptas saepe cum",
            "beschreibung": "Eine Packung Spaghetti",
            "gueltigkeitsablaufdatum": "2015-12-09T02:34:01.035Z",
            "status":"nicht_zugewiesen",
            "zustanedigetafel":"http://foodhood.org/Tafelverein/23", 
            "anbieter":"http://foodhood.org/Benutzer/2",
            "geolocation":{
                "lat": 50.935325,
                "lng": 6.975087
            },
            "enthalteneangebote":[]
        }
        
        var testangebot9 = {
            "gewicht": 0.4,
            "artikelkategorien": [
                "konserven und fertiggerichte"
            ],
            "erstellungsdatum": current_date.toISOString(),
            "standort":{
                "country-name":"Germany",
                "region":"NRW",
                "postal-code":"50679",
                "street-address":"Helenenwallstraße 24"
            },
            "abholtermine": [
                
            ],
            "bild": "voluptas saepe cum",
            "beschreibung": "Eine Packung Spaghetti",
            "gueltigkeitsablaufdatum": "2015-12-09T02:34:01.035Z",
            "status":"nicht_zugewiesen",
            "zustanedigetafel":"http://foodhood.org/Tafelverein/23", 
            "anbieter":"http://foodhood.org/Benutzer/2",
            "geolocation":{
                "lat": 50.933533, 
                "lng": 6.974528
            },
            "enthalteneangebote":[]
        }
        
        var testangebot10 = {
            "gewicht": 0.4,
            "artikelkategorien": [
                "konserven und fertiggerichte"
            ],
            "erstellungsdatum": current_date.toISOString(),
            "standort":{
                "country-name":"Germany",
                "region":"NRW",
                "postal-code":"50679",
                "street-address":"Alarichstraße 7"
            },
            "abholtermine": [
                
            ],
            "bild": "voluptas saepe cum",
            "beschreibung": "Eine Packung Spaghetti",
            "gueltigkeitsablaufdatum": "2015-12-09T02:34:01.035Z",
            "status":"nicht_zugewiesen",
            "zustanedigetafel":"http://foodhood.org/Tafelverein/23", 
            "anbieter":"http://foodhood.org/Benutzer/2",
            "geolocation":{
                "lat": 50.934153,
                "lng": 6.978539
            },
            "enthalteneangebote":[]
        }
        
        
        var angebote = [testangebot1,testangebot2,testangebot3,testangebot4,testangebot5,testangebot6,testangebot7,testangebot8,testangebot9,testangebot10];

        var options = {
            host: "localhost",
            port: 3000,
            path: "/Angebot",
            method:"POST",
            headers:{
                'accept':'application/json',
                'Content-Type': 'application/json'
            }
        }

        var von = new Date();
        var bis = new Date();
        
        var abholterminstartOffset = 0;
        var abholterminEndeOffset = 4;

        async.each(angebote, function(item,next){

            //Aktuelles Datum & Uhrzeit , Start eines Abholtermins wird in jedem Durchlauf um <abholterminstartOffset> verschoben 
            von.setHours(von.getHours()+abholterminstartOffset);
            
            //Aktuelles Datum & Uhrzeit + Offset 
            bis.setHours(bis.getHours()+abholterminEndeOffset);
            
            inspect(von);
            inspect(bis);

            item.abholtermine.push({
                "von":von.toISOString(),
                "bis": bis.toISOString()
            });

            var testSetupRequest = http.request(options,function(response){

                if(response.statusCode == 201){
                    next();
                }

                else{

                }
            });

            testSetupRequest.write(JSON.stringify(item));
            testSetupRequest.end();

        }, function(err){

            if( err ) {
                console.log("TestAngebote konnten nicht eingefügt werden");
            }
        });
    },


    //Fügt eine Reihe von Test-Benutzern in das System ein 
    insertTestBenutzer : function(){

        var testBenutzer1={
            "card": {
                "familiyname": "Musterfrau",
                "givenname": "Marina",
                "nickname": "MaMusterfrau",
                "email": {
                    "value": "marina.musterfrau@example.com"
                },
                "tel": {
                    "value": "0221222202022",
                    "type": "mobile"
                },
                "address":{
                    "country-name":"Germany",
                    "region":"NRW",
                    "postal-code":"50667",
                    "street-address":"Gertrudenstraße 19"
                },
                "geo": {
                    "latitude": "50.937531",
                    "longitude": "6.960279"
                }
            },
            "verantwortlichkeiten":[]
        }

        var testBenutzer2={
            "card": {
                "familiyname": "Mustermann",
                "givenname": "Max",
                "nickname": "MaMustermann",
                "email": {
                    "value": "max.mustermann@example.com"
                },
                "tel": {
                    "value": "0221222202022",
                    "type": "mobile"
                },
                "address": {
                    "country-name":"Germany",
                    "region":"NRW",
                    "postal-code":"50667",
                    "street-address":"Wolfsstraße 8",
                    "locality": "Köln"
                },
                "geo": {
                    "latitude": "50.937531",
                    "longitude": "6.960279"
                }
            },
            "verantwortlichkeiten":[]
        }

        var testBenutzer3={
            "card": {
                "familiyname": "Podolski",
                "givenname": "Lukas",
                "nickname": "DäPrinz",
                "email": {
                    "value": "prinzPoldi@koeln.de"
                },
                "tel": {
                    "value": "0221222202022",
                    "type": "mobile"
                },
                "address": {
                    "country-name":"Germany",
                    "region":"NRW",
                    "postal-code":"50667",
                    "street-address":"Richmodstraße 10",
                    "locality": "Köln"
                },
                "geo": {
                    "latitude": "50.937531",
                    "longitude": "6.960279"
                }
            },
            "verantwortlichkeiten":[]
        }

        var benutzer=[testBenutzer1,testBenutzer2,testBenutzer3]

        var options = {
            host: "localhost",
            port: 3000,
            path: "/Benutzer",
            method:"POST",
            headers:{
                'accept':'application/json',
                'Content-Type': 'application/json'
            }
        }

        async.each(benutzer, function(item,next){

            var testSetupRequest = http.request(options,function(response){

                if(response.statusCode != 201){
                    throw err;
                }

                else{
                    next();
                }
            });

            testSetupRequest.write(JSON.stringify(item));
            testSetupRequest.end();

        }, function(err){

            if( err ) {
                console.log("TestBenutzer konnten nicht eingefügt werden");
            }
        });
    },

    insertTestTafelvereine: function(){

        //Eche Tafelvereintsadresse 
        var tafelverein1={
            "card":{
                "address": {
                    "locality": "Köln",
                    "region": "NRW",
                    "country-name": "Germany",
                    "street-address":"Kopischstr 6",
                    "postal-code":51069
                },
                "geo": { 
                    "latitude":50.9758310, 
                    "longitude":7.0649470
                },
                "org": {
                    "organizationName": "Kölner Tafel",
                    "organizationUnit": "Dellbrück"
                }
            },
            "opening_hours":[{
                "opens":"08:30:00",
                "closes":"09:30:00",
                "validFrom":"2015-12-26",
                "validThrough":"2015-12-30",        
                "day_of_week":["MO","DI","MI"],
                "wiederholung":"Woche"
            }],
            "zustaendigkeiten":[51067,51068,51069]
        }

        //Fiktive Adresse eines Tafelvereins, zu Demozwecken  
        var tafelverein2={
            "card":{
                "address": {
                    "locality": "Köln",
                    "region": "NRW",
                    "country-name": "Germany",
                    "street-address":"Gereonswall 7",
                    "postal-code":50668
                },
                "geo": { 
                    "latitude":50.9489100, 
                    "longitude":6.9553760
                },
                "org": {
                    "organizationName": "Kölner Tafel",
                    "organizationUnit": "Innenstadt"
                }
            },
            "opening_hours":[{
                "opens":"08:30:00",
                "closes":"09:30:00",
                "validFrom":"2015-12-26",
                "validThrough":"2015-12-30",        
                "day_of_week":["MO","DI","MI"],
                "wiederholung":"Woche"
            }],
            "zustaendigkeiten":[50668,50670]
        }

        var tafelvereine=[tafelverein1,tafelverein2];


        var options = {
            host: "localhost",
            port: 3000,
            path: "/Tafelverein",
            method:"POST",
            headers:{
                'accept':'application/json',
                'Content-Type': 'application/json'
            }
        }

        async.each(tafelvereine, function(item,next){

            var testSetupRequest = http.request(options,function(response){

                if(response.statusCode != 201){
                    throw err;
                }

                else{
                    next();
                }
            });

            testSetupRequest.write(JSON.stringify(item));
            testSetupRequest.end();

        }, function(err){

            if( err ) {
                console.log("TestTafelvereine konnten nicht eingefügt werden");
            }
        });
    },

    insertTestLagerorte:function(){

        var options = {
            host: "localhost",
            port: 3000,
            path: "/Lager",
            method:"POST",
            headers:{
                'accept':'application/json',
                'Content-Type': 'application/json'
            }
        }

        var lagerort1={
            "card":{
                "address": {
                    "locality": "Köln",
                    "region": "NRW",
                    "country-name": "Germany",
                    "street-address":"Thürmchenswall 36",
                    "postal-code":50668
                },
                "geo": { 
                    "latitude":50.9491760, 
                    "longitude":6.9594410
                },
                "familyname":"Mustermann",
                "givenname":"Max",
                "tel":"0221/456263633"
            },
            "opening_hours":[{
                "opens":"15:00:00",
                "closes":"17:00:00",
                "validFrom":"2014-12-26",
                "validThrough":"2016-12-30",        
                "day_of_week":["MO","TU","WE","TH","FR"],
                "wiederholung":"Woche"
            }]
        }

        var lagerort2={

            "card":{
                "address": {
                    "locality": "Köln",
                    "region": "NRW",
                    "country-name": "Germany",
                    "street-address":"Ebertplatz 10",
                    "postal-code":50668
                },
                "geo": { 
                    "latitude":50.9500280, 
                    "longitude":6.9576550
                },
                "familyname":"Maike",
                "givenname":"Musterfrau",
                "tel":"0221/43498443"
            },
            "opening_hours":[{
                "opens":"15:00:00",
                "closes":"17:00:00",
                "validFrom":"2014-12-26",
                "validThrough":"2016-12-30",        
                "day_of_week":["MO","TU","WE","TH","FR"],
                "wiederholung":"Woche"
            }]
        }

        var lagerort3={

            "card":{
                "address": {
                    "locality": "Köln",
                    "region": "NRW",
                    "country-name": "Germany",
                    "street-address":"Ernastraße 13",
                    "postal-code":51069
                },
                "familyname":"Lukas",
                "givenname":"Mustermann",
                "tel":"0221/2466462",
                "geo": { 
                    "latitude": 50.9791220, 
                    "longitude": 7.0663640 
                }
            },
            "opening_hours":[{
                "opens":"15:00:00",
                "closes":"17:00:00",
                "validFrom":"2014-12-26",
                "validThrough":"2016-12-30",        
                "day_of_week":["MO","TU","WE","TH","FR"],
                "wiederholung":"Woche"
            }]
        }

        var lagerorte = [lagerort1,lagerort2,lagerort3];

        async.each(lagerorte, function(item,next){

            var testSetupRequest = http.request(options,function(response){

                if(response.statusCode != 201){
                    throw err;
                }

                else{
                    next();
                }
            });

            testSetupRequest.write(JSON.stringify(item));
            testSetupRequest.end();

        }, function(err){

            if( err ) {
                console.log("Lagerorte konnten nicht eingefügt werden");
            }
        });
    }

}

