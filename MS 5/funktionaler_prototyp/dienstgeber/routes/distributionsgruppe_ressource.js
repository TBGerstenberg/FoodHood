var app = express.Router();

//Eigene kleine Libary zur Auslagerung wiederkehrender Aufgaben
var lib = require('../lib/foodhood_db.js');

//Liefert Links auf alle im System vorhandenen Distributionsgruppen
app.get('/',function(req,res){

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            var distributionsgruppencollection=[];

            lib.findCollection('distributionsgruppen',function(result){

                result.forEach(function(entry){
                    distributionsgruppencollection.push(lib.generateLink('distributionsgruppe',entry.id));
                });

                res.status(200).json(distributionsgruppencollection).end();  
            });
            break;

        default:
            res.status(406).end();
    }
});

//Liefert eine Repräsentation eines Angebots 
app.get('/:DistributionsgruppeId',function(req,res){

    //Prüfe ob Client einen unterstützen Media-Type verarbeiten kann 
    var acceptedTypes = req.get('Accept');

    switch(acceptedTypes){
        case "application/json":

            var params={
                id:Number(req.params.DistributionsgruppeId)
            }

            lib.findDocument('distributionsgruppen',params,function(result){

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

app.get('/:DistributionsgruppeId/Statistiken',function(req,res){
    res.status(501).end();
});

module.exports = app;