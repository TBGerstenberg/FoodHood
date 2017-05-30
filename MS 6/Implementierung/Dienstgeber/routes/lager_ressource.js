var app = express.Router();

//Eigene kleine Libary zur Auslagerung wiederkehrender Aufgaben
var lib = require('../lib/foodhood_db.js');

//Liefert Hyperlinks auf alle im System vorhandenen Lagerorte
app.get('/',function(req,res){

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            var lagercollection=[];

            lib.findCollection('lagerorte',function(result){

                result.forEach(function(entry){
                    lagercollection.push(lib.generateLink("lagerort",entry.id));
                });

                res.status(200).json(lagercollection).end();  
            });
            break;

        default:
            res.status(406).end();
    }
});

//Liefert eine Repräsentation eines Benutzers 
app.get('/:LagerId',function(req,res){

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            var params={
                id:Number(req.params.LagerId)
            }

            lib.findDocument('lagerorte',params,function(result){

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

/*Ändert die Information des Benutzers mit {LagerId},
  Updates von "Arrays of Objects" sind mit MongoDB nicht ganz einfach, da 
  dies auch nicht zwingend notwendig im vertikalen prototypen ist wird 
  diese Operation zunächst zurückgestellt 
*/
app.patch('/:LagerId',function(req,res){

    res.status(501).end();
    
    /*
    //Prüfe ob Contenttype der Anfrage verarbeitet werden kann 
    lib.checkContent(req,res);

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            var searchparams={
                "id":Number(req.params.LagerId)
            }

            
            var opening_hours=req.body.opening_hours[0];
            
            var updateparams={
                $set: { 
                        "opening_hours":opening_hours
                }
            }

            lib.updateDocument('lagerorte',searchparams,updateparams,function(result){
                console.log("in der Lagerressource"); 
                inspect(result);
                res.status(200).json(result).end();
            });
            break;

        default:
            res.status(406).end();
    }
    */
});

/* Fügt der Collection aller Lagerorte einen weiteren hinzu */
app.post('/',function(req,res){

    lib.checkContent(req,res);

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":
            console.log("Lagerortressource connected to the server");

            //Generiere fortlaufende ID 
            lib.getNextSequence("lagerorteid",function(id){ 

                //Füge generierte ID in Angebotsrepräsentation ein 
                var lagerortobject = req.body; 
                lagerortobject.id=id;

                //Füge Datensatz in die Collection aller Lagerorte ein 
                lib.insertDocument("lagerorte",lagerortobject,function(){

                    //Antworte mit eingefügter Repräsentation 
                    res.set("Location",lib.generateLink('lager',id)).status(201).json(lagerortobject).end();  
                });
            });
            break;

        default:
            res.status(406).end();
    }
});

/* Entfernt den Lagerort mit {LagerId} aus dem System .*/
app.delete('/:LagerId',function(req,res){

    var params={
        "id":Number(req.params.LagerId)
    }

    lib.deleteDocument('lagerorte',params,function(success){
        if(success){
            res.status(204).end();
        }
        else{
            res.status(404).end();
        }
    });
});

module.exports = app;