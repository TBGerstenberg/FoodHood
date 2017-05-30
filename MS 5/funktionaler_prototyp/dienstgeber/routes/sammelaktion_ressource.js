var app = express.Router();

//Eigene kleine Libary zur Auslagerung wiederkehrender Aufgaben
var lib = require('../lib/foodhood_db.js');

//Liefert Hyperlinks auf alle im System vorhandnenen Sammelaktionen 
app.get('/',function(req,res){

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            var sammelaktioncollection=[];

            lib.findCollection('sammelaktionen',function(result){

                result.forEach(function(entry){
                    sammelaktioncollection.push(lib.generateLink("sammelaktion",entry.id));
                });

                res.status(200).json(sammelaktioncollection).end();  
            });
            break;

        default:
            res.status(406).end();
    }
});

//Liefert einer Repräsentation der Sammelatkion mit <id>
app.get('/:SammelaktionId',function(req,res){

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            var params={
                id:Number(req.params.SammelaktionId)
            }

            lib.findDocument('sammelaktionen',params,function(result){

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
  PATCH statt PUT verwendet.*/
app.patch('/:SammelaktionId',function(req,res){

    //Prüfe ob Contenttype der Anfrage verarbeitet werden kann 
    lib.checkContent(req,res);

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            //Finde Sammelaktion
            var searchparams={
                "id":Number(req.params.SammelaktionId) 
            }

            var updateparams={ 
                $set:{
                    "status":req.body.status,
                }
            }

            lib.updateDocument('sammelaktionen',searchparams,updateparams,function(result){

                //Update war erfolgreich, Antworte
                res.status(200).json(result).end();

                var zielstandortTyp = req.body.zielstandort.split('/')[0];
                var zielstandortId = req.body.zielstandort.split('/')[1];

                //Die Aktion wurde abgeschlossen, der Zielstandort ist kein Tafelverein, 
                //Alle Angebote müssen zu einem neuen Angebot zusammengefügt werden 
                if(req.body.status=='done' && zielstandortTyp !='Tafelverein'){

                    //Update alle Angebote die in dieser Sammelaktion angefahren werden 
                    async.each(req.body.route,function(item,next){

                        //Finde AngebotsIds
                        var angebotsId=Number(item.angebot.split('/')[1]);

                        //Finde alle Angebote, die in dieser Sammelaktion angefahren werden
                        var searchParams={
                            "id":angebotsId
                        }    

                        //Setze die Angebote auf den Status "abgeholt" 
                        var updateParams={
                            $set:{
                                "status":"abgeholt",
                            }
                        }

                        lib.updateDocument('angebote',searchParams,updateParams,function(result){

                        });


                        //Aus den aggregierten Spenden wird ein neues Angebot erzeugt 
                        lib.getNextSequence('angebote',function(id){

                            var aggregiertesAngebot = {
                                id:id,
                                gewicht:req.body.gesamtgewicht,                
                                erstellungsdatum: moment().format(),
                                standort:req.body.zielstandort,
                                abholtermine:[],
                                status:'nicht_zugewiesen'
                            }

                            lib.insertDocument('angebote',aggregiertesAngebot,function(result){
                            });
                        });
                    });  
                }
                else{
                    //Angebote auf Abgeholt setzen
                    //Tafel benachrichtigen
                }
            });

            break;

        default:
            res.status(406).end();
    }
});

/* Fügt der Benutzercollection einen neuen Benutzer hinzu und 
*  generiert einen Platzhalter für die Benutzer-Subressource "Situation" */
app.post('/',function(req,res){

    lib.checkContent(req,res);

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":
            console.log("Sammelaktionressource connected to the server");

            async.waterfall([

                function(callback){

                    var angebotsId=Number(req.body.route[0].angebot.split('/')[1]);

                    //Frage ab ob die Sammelaktionsrepräsentation ein Angebot enthält, welches bereits Teil einer
                    //anderen Aktion ist 
                    var searchparams={
                        id:angebotsId   
                    }

                    lib.findDocument('angebote',searchparams,function(result){
                        // Ein Angebot wurde bereits für eine Abholung im Rahmen einer anderen Aktion 
                        //getätigt.
                        // Da ein Angebot nicht in mehreren Aktionen gleichzeitig stehen kann 
                        //ist diese Post Operation nicht erlaubt
                        if(result.status=="ist_zugewiesen"){
                            res.status(409).end();
                        }

                        else{
                            callback();
                        }
                    });
                },
                //Posten kann durchgeführt werden
                function(callback){

                    //Generiere fortlaufende ID 
                    lib.getNextSequence("sammelaktionid",function(id){ 

                        //Füge generierte ID in Benutzerrepräsentation ein 
                        var sammelaktionobject = req.body; 
                        sammelaktionobject.id=id;

                        //Update alle Angebote die in dieser Sammelaktion angefahren werden 
                        async.each(req.body.route,function(item,next){

                            var angebotsId=Number(item.angebot.split('/')[1]);

                            //Finde alle Angebote, die in dieser Sammelaktion angefahren werden
                            //Und setze ihren status auf "zugewiesen", verlinke auf den sammler 
                            var searchParams={
                                "id":angebotsId
                            }    

                            var updateParams={
                                $set:{
                                    "status":"zugewiesen",
                                    "abholer":req.body.sammler
                                }
                            }

                            lib.updateDocument('angebote',searchParams,updateParams,function(result){

                            });
                        });

                        //Füge Datensatz in die Collection aller benutzer ein 
                        lib.insertDocument("sammelaktionen",sammelaktionobject,function(){
                            
                            
                            
                            //Finde die AngebotsId eines Angebots
                            var angebotId = sammelaktionobject.route[0].angebot.split('/')[1];
                            var plz;
                            
                            var searchParams = {
                                "id":Number(angebotId)
                            }
                            
                            lib.findDocument("angebote",searchParams,function(result){
                                console.log("Result" +result);
                                if(result){
                                    plz=result.standort["postal-code"];
                                }
                                else{
                                    res.status(404).end();
                                }
                            });

                            amqp.connect('amqp://localhost', function(err, conn) {
                                conn.createChannel(function(err, ch) {
                                    
                                    var messageDaten = {
                                        "information":"In deinem Postleitzahlengebiet findet bald eine Sammelaktion statt!",
                                        "link":lib.generateLink("sammelaktion",id),
                                    }
                                    messageDaten = JSON.stringify(messageDaten);
                                   
                                    var msg = process.argv.slice(2).join(' ') || messageDaten;
 
                                    ch.assertExchange(plz, 'fanout', {durable: false});
                                    //Nachricht an den Exchange mit dem identifier plz schicken. 
                                    ch.publish(plz, plz, new Buffer(msg));
                                    console.log(" [x] Sent %s", msg);
                                });
                                setTimeout(function() { conn.close(); process.exit(0) }, 500);
                            });

                            //Antworte mit eingefügter Repräsentation 
                            res.set("Location",lib.generateLink('sammelaktion',id)).status(201).json(sammelaktionobject).end();
                            callback();
                        });
                    });
                }],function(err,result){

                if(err){
                    res.status(500).end();
                }
            });

            break;

        default:
            res.status(406).end();
    }
});

//Löscht eine Sammelaktion mit {SammelaktionId}
app.delete('/:SammelaktionId',function(req,res){

    var params={
        "id":Number(req.params.SammelaktionId)
    }

    //Finde die Sammelaktion 
    lib.findDocument('sammelaktionen',params,function(result){

        if(result){
            //Update alle Angebote die in dieser Sammelaktion angefahren werden sollten und gebe Angebote wieder frei  
            async.each(result.route,function(item,next){

                var angebotsId=Number(item.angebot.split('/')[1]);

                //Finde alle Angebote, die in dieser Sammelaktion angefahren werden
                //Und setze ihren status auf "zugewiesen", verlinke auf den sammler 
                var searchParams={
                    "id":angebotsId
                }    

                var updateParams={
                    $set:{
                        "status":"nicht_zugewiesen",
                        "abholer":null
                    }
                }

                lib.updateDocument('angebote',searchParams,updateParams,function(result){

                });
            });
        }
        else{
            res.status(404).end();

        }
    });

    lib.deleteDocument("sammelaktionen",params,function(success){
        if(success){
            res.status(204).end();
        }
        else{
            res.status(404).end();
        }
    });
});

module.exports = app;