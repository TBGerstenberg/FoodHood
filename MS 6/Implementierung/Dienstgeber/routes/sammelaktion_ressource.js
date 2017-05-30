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

                //Füge Links zu allen Sammelaktionen in Collection 
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
  PATCH statt PUT verwendet.

  Wird eine Sammelaktion beendet so kann dies mit dieser Operation mitgeteilt werden, das "Status" Attribut 
  der Sammelaktion wird in diesem Fall auf "Done" gesetzt, was ein Update alle betroffenen Angebote nachsichzieht, die den Status "abgeholt" erhalten. 
  Sollte der Zielstandort ein Tafelverein sein, so wird dieser Tafelverein über die Anfahrt benachrichtigt. Sollte dies nicht der Fall sein 
  so wird aus gesammelten Spenden am Zielstandort ein neues Angebot erzeugt */
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

            //Extrahiere den Zielstandort 
            var zielstandortTyp = req.body.zielstandort.split('/')[0];
            var zielstandortId = req.body.zielstandort.split('/')[1];

            async.waterfall([

                //Update die Sammelaktion
                function(callback){

                    //Patche die Sammelaktion 
                    lib.updateDocument('sammelaktionen',searchparams,updateparams,function(result){

                        //Die Aktion wurde abgeschlossen, setze alle enthaltenen Angebote auf Status = abgeholt 
                        if(req.body.status=='done'){

                            //Update alle Angebote die in dieser Sammelaktion angefahren werden 
                            async.each(req.body.route,function(item,next){

                                //Finde AngebotsIds
                                var angebotsId=Number(item.angebot.split('/')[1]);

                                //Finde alle Angebote, die in dieser Sammelaktion angefahren werden
                                var searchParams={
                                    "id":Number(angebotsId)
                                }    

                                //Setze die Angebote auf den Status "abgeholt" 
                                var updateParams={
                                    $set:{
                                        "status":"abgeholt",
                                    }
                                }

                                lib.updateDocument('angebote',searchParams,updateParams,function(result){
                                    next();
                                });

                            },function(err){
                                callback(null,result);
                            });
                        }

                        else{
                            callback(null,result);
                        }
                    });
                }

            //Füge das aggregierte Angebot am Zielstandort der Sammelaktion ein 
            ],function(err,sammelaktion){

                if(zielstandortTyp !='Tafelverein'){

                    //Aus den aggregierten Spenden wird ein neues Angebot erzeugt 
                    lib.getNextSequence('angebotid',function(id){

                        var aggregiertesAngebot = {
                            id:id,
                            gewicht:req.body.gesamtgewicht,                
                            erstellungsdatum: moment().format(),
                            standort:req.body.zielstandort,
                            abholtermine:[],
                            status:'nicht_zugewiesen'
                        }

                        lib.insertDocument('angebote',aggregiertesAngebot,function(result){
                            //Update war erfolgreich, Antworte
                            res.status(200).json(sammelaktion).end();
                        });
                    });
                }

                else{
                    //Update war erfolgreich, Antworte
                    res.status(200).json(results).end();
                }
            });
            break;

        default:
            res.status(406).end();
    }
});

/* Fügt der Sammelaktionscollection einen neue Sammelaktion hinzu 
*  Sperrt alle in dieser Aktion enthaltenen Angebote für weitere Sammelaktionen */
app.post('/',function(req,res){

    lib.checkContent(req,res);

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":
            console.log("Sammelaktionressource connected to the server");

            async.waterfall([
                function(callback){

                    //Gehe alle beteiligten Angebote durch und frage ob sie schon Teil einer anderen Aktion sind 
                    async.each(req.body.route,function(item,next){

                        var angebotsId=Number(item.angebot.split('/')[1]);

                        var searchparams={
                            id:angebotsId   
                        }

                        lib.findDocument('angebote',searchparams,function(result){

                            //Es konnte ein Angebot gefunden werden 
                            if(result){
                                /*  Das Angebot wurde bereits für eine Abholung im Rahmen einer anderen Aktion 
                                getätigt.
                                Da ein Angebot nicht in mehreren Aktionen gleichzeitig stehen kann 
                                ist diese Post Operation nicht erlaubt */
                                if(result.status=="zugewiesen"){
                                    console.log("Ein Angebot in dieser Sammelaktion ist bereits zugewiesen! POST nicht moeglich");
                                    res.status(409).end();
                                }
                                else{
                                    next();
                                }
                            }
                            //Eines der Angebote existiert nicht 
                            else{
                                res.status(409).end();
                            }
                        });

                        //Alle Angebote sind noch frei 
                    },function(err,result){

                        callback();
                    });    
                },
                //Posten kann durchgeführt werden
                function(callback){

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
                            next();
                        });
                    },function(results){
                        callback();
                    });
                },
                //Update die Sammelaktion 
                function(callback){

                    //Generiere fortlaufende ID 
                    lib.getNextSequence("sammelaktionid",function(id){ 

                        //Füge generierte ID in Benutzerrepräsentation ein 
                        var sammelaktionobject = req.body; 
                        sammelaktionobject.id=id;

                        //Füge Datensatz in die Collection aller Sammelaktionen ein 
                        lib.insertDocument("sammelaktionen",sammelaktionobject,function(result){
                            callback(null,sammelaktionobject);
                        });
                    });   
                },
                //Finde die PLZ in der diese Sammelaktion stattfindet 
                function(sammelaktion,callback){

                    inspect("Im nächsten Callback");
                    inspect(sammelaktion);

                    //Finde die AngebotsId eines Angebots
                    var angebotId = sammelaktion.route[0].angebot.split('/')[1];
                    var plz;

                    var searchParams = {
                        "id":Number(angebotId)
                    }

                    lib.findDocument("angebote",searchParams,function(result){
                        console.log("Result" +result);
                        if(result){
                            plz=result.standort["postal-code"];
                            callback(null,plz,sammelaktion);
                        }
                        else{
                            res.status(404).end();
                        }
                    });

                },
                //Publishe die Sammelaktion 
                function(plz,sammelaktion,callback){

                    //Antworte mit eingefügter Repräsentation 
                    res.set("Location",lib.generateLink('sammelaktion',sammelaktion.id)).status(201).json(sammelaktion).end();

                    //Publishe eine Nachricht an das Topic "<PLZ>" und benachrichtige so alle Clients dieses Wohnortes sowie die zuständige Tafel 
                    //Exachange type "fanout" - 
                    amqp.connect('amqp://localhost', function(err, conn) {

                        conn.createChannel(function(err, ch) {

                            var messageDaten = {
                                "information":"In deinem Postleitzahlengebiet findet bald eine Sammelaktion statt!",
                                "link":lib.generateLink("sammelaktion",sammelaktion.id),
                            }

                            messageDaten = JSON.stringify(messageDaten);

                            var msg = messageDaten;

                            ch.assertExchange(plz, 'fanout', {durable: false});

                            //Nachricht an den Exchange mit dem identifier plz schicken. 
                            ch.publish(plz, plz, new Buffer(msg));

                            console.log(" [x] Sent %s", msg);
                        });
                        setTimeout(function() { conn.close(); }, 500);
                    });
                }]);
            break;

        default:
            res.status(406).end();
    }
});

//Löscht eine Sammelaktion mit {SammelaktionId}
//Gibt darin enthaltene Angebote wieder frei, sollten sie noch nicht abgeholt worden sein 
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

                lib.findDocument('angebote',searchParams,function(result){
                    if(result){
                        if(result.status!='abgeholt'){

                            var updateParams={
                                $set:{
                                    "status":"nicht_zugewiesen",
                                    "abholer":null
                                }
                            }

                            lib.updateDocument('angebote',searchParams,updateParams,function(result){

                            });
                        }
                    }
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