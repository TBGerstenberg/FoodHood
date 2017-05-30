var app = express.Router();

//Eigene kleine Libary zur Auslagerung wiederkehrender Aufgaben
var lib = require('../lib/foodhood_db.js');

/* Liefert Hyperlinks auf alle im System vorhandenen Tafelvereine*/
app.get('/',function(req,res){

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            var tafelvereincollection=[];

            lib.findCollection('tafelvereine',function(result){

                result.forEach(function(entry){
                    tafelvereincollection.push(lib.generateLink("tafelverein",entry.id));
                });

                res.status(200).json(tafelvereincollection).end();  
            });
            break;

        default:
            res.status(406).end();
    }
});

//Liefert eine Repräsentation eines Tafelvereins
app.get('/:TafelvereinId',function(req,res){

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            var params={
                id:Number(req.params.TafelvereinId)
            }

            lib.findDocument('tafelvereine',params,function(result){

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


app.patch('/:TafelvereinId',function(req,res){
    res.status(501).end();
});

/* Fügt der Tafelvereincollection einen neuen hinzu */
app.post('/',function(req,res){

    lib.checkContent(req,res);

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":
            console.log("Tafelvereinressource connected to the server");

            //Generiere fortlaufende ID 
            lib.getNextSequence("tafelvereinid",function(id){ 
 
                //Füge generierte ID in Tafelvereinrepräsentation ein 
                var tafelvereinobject = req.body; 
                tafelvereinobject.id=id;
            
                //Füge Datensatz in die Collection aller Tafelvereine ein 
                lib.insertDocument("tafelvereine",tafelvereinobject,function(){

                    //Antworte mit eingefügter Repräsentation 
                    res.set("Location",lib.generateLink('tafelverein',id)).status(201).json(tafelvereinobject).end();  
                });
            });
            break;

        default:
            res.status(406).end();
    }
});

/* Entfernt den Tafelverein mit {TafelvereinId} aus dem System .*/
app.delete('/:TafelvereinId',function(req,res){

    var params={
        "id":Number(req.params.TafelvereinId)
    }

    lib.deleteDocument('tafelvereine',params,function(success){
        if(success){
            res.status(204).end();
        }
        else{
            res.status(404).end();
        }
    });
});

module.exports = app;