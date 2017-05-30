
//Definiere express modul für alle Routen 
global.express = require('express');

//Definiere den Client für mongoDB
global.mongoClient= require('mongodb').MongoClient;

//eyes modul für farbige Konsolenausgaben , maxlength : false hebt die Depth-level Grenze der Anzeige auf 
global.inspect=require('eyes').inspector({maxLength: false});

//assert Modul für Unit tests 
global.assert=require('assert');

//async Modul für übersichtliches abwickeln mehrerer asynchroner Operationen 
global.async=require('async');

//geocoder Modul für GoogleMaps API, nur für Geocoding verwendet
global.geocoder=require('geocoder');

//MomentJS-Modul für komfortablen Umgang mit Datetime-Strings
global.moment=require('moment');

//MomentJS-Range Erweiterung um Berechnungen auf Zeitintervallen durchzuführen 
global.moment_range=require('moment-range');

//Amqp Modul für Pub/Sub Kommunikation
global.amqp = require('amqplib/callback_api');

//Url unter der die Datenbank angesprochen werden kann
var mongoUrl = 'mongodb://127.0.0.1:27017/test';

//Kleines Modul um Testdaten in die Datenbank einzupflegen 
var testDataInserter = require('./test/testDataInserter.js');

//pseudoglobale DB Instanz
var db;

//Flag das anzeigt ob Testdaten generiert werden sollen 
var testDataNeeded=false;

if(process.argv[2] == "-testdata"){
    testDataNeeded=true;
}

var app = express();

//Binde das Bodyparser Modul ein
var bodyParser = require('body-parser');
app.use(bodyParser.json());

//Binde den JSON-Schema Validator ein , Schemavalidation konnte nicht mehr umgesetzt werden 
//var jsonvalidator = require('jsonschema').Validator;
//global.validator = new jsonvalidator();

//Definiere die Routen zu den einzelnen Ressourcen 
app.use('/Benutzer', require('./routes/benutzer_ressource'));
app.use('/Sammelaktion', require('./routes/sammelaktion_ressource'));
app.use('/Angebot', require('./routes/angebot_ressource'));
app.use('/Tafelverein',require('./routes/tafelverein_ressource'));
app.use('/Lager',require('./routes/lager_ressource'));
app.use('/Distributionsgruppe',require('./routes/distributionsgruppe_ressource'));

//Lasse den Dienstgeber auf Port 3000 lauschen 
app.set('port', process.env.PORT || 3000);

//DB Setup 
mongoClient.connect(mongoUrl, function(err, database) { 

    async.series([
        
        function(callback){
            //Einzelne Counter für die Ids verschiedener Ressourcen anlegen, diese Counter Collection 
            //stellt sicher, dass eindeutige Bezeichner für alle Ressourcen generiert werden können
            database.collection('counters').insertMany([
                {
                    _id: "benutzerid",
                    sequence_value: 0
                },
                {
                    _id: "sammelaktionid",
                    sequence_value: 0
                },
                {
                    _id: "angebotid",
                    sequence_value: 0
                },
                {
                    _id: "lagerorteid",
                    sequence_value: 0
                },
                {
                    _id: "tafelvereinid",
                    sequence_value: 0
                },
                {
                    _id: "distributionsgruppeid",
                    sequence_value: 0
                }
            ]);

            callback(null);
        }
    ],function(err, results){

        //DB Instanz in allen Routen verfügbar machen
        module.exports.db=db=database;

        //App starten 
        app.listen(app.get('port'), function () {
            console.log('Server is listening on port ' + app.get('port'));

            if(testDataNeeded){

                //Testangebotsdaten in DB einpflegen 
                testDataInserter.insertTestAngebote();

                //TestBenutzerDaten in DB einpflegen 
                testDataInserter.insertTestBenutzer();
                
                //TestTafelvereinDaten in DB einpflegen
                testDataInserter.insertTestTafelvereine();
                
                //Lagerorte in die DB einpflegen
                testDataInserter.insertTestLagerorte();
            }
        });
    });
});

process.stdin.resume();//so the program will not close instantly

//Cleanup Funktion um vor Beendigung der App  bspw. noch die Verbindung zur Datenbank zu schließen 
process.on('SIGINT', function () {
    db.close();
    process.exit();
});
