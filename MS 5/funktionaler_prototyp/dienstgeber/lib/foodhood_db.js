var dienstgeber = require('../dienstgeber.js');

module.exports = {

    /*
    * Fügt einen Eintrag in MongoDB hinzu 
    * @param collection - name der collection {string}
    * @param parameters - Vergleichsparameter zum auffinden des Eintrags , , mongo <query> Object
    */
    insertDocument : function(collection,document,callback) {

        dienstgeber.db.collection(collection).insertOne(document,function(err, result) {

            if(err){
                throw new Error("Fehler beim Einfügen eines Dokuments aus der "+collection + " collection");
            }
            else{
                console.log("Inserted a document into the " + collection + " collection.");
                console.log("Inserted Document:");
                inspect(document);   
                callback(result);
            }
        });
    },

    /*
    * Sucht einen Eintrag in mongoDB
    * @param collection - name der collection {string}
    * @param parameters - Vergleichsparameter zum auffinden des Eintrags , mongo <query> Object
    */
    findDocument:function(collection,parameters,callback) {
        dienstgeber.db.collection(collection).findOne(parameters,function(err,doc){ 

            if(err){
                throw new Error("Fehler beim Abrufen eines Dokuments aus der "+collection + " collection");
            }
            else{
                console.log("Trying to find a document in the " + collection + " collection.");
                console.log("Found an Item \n");
                inspect(doc);
                callback(doc);
            }
        });
    },

    /*
    * Sucht eine Collection 
    * @param collection - name der collection {string}
    * 
    */
    findCollection:function(collection,callback){

        dienstgeber.db.collection(collection).find().toArray(function(err,doc){ 

            if(err){
                throw new Error("Fehler beim Auslesen aus der " + collection + "collection");
            }

            else{
                console.log("Trying to find the " + collection + " collection.");
                console.log("Found:  \n");
                inspect(doc);
                callback(doc);
            }
        });
    },

    /*
    * Sucht mehrere Dokumente die  
    * @param collection - name der collection {string}
    * @param parameters - Vergleichsparameter zum auffinden des Eintrags , mongo <query> Object
    */
    findDocuments:function(collection,parameters,callback){

        dienstgeber.db.collection(collection).find(parameters).toArray(function(err,doc){

            if(err){
                throw new Error("Fehler beim Auffinden eines Elements aus der " + collection + "collection");
            }
            else{
                console.log("Trying to find the " + collection + " collection.");
                console.log("Found:  \n");
                inspect(doc);
                callback(doc);
            }
        });
    },

    /*
    * Ändert ein Dokument aus mongoDB
    * @param collection - name der collection {string}
    * @param searchparameters - Vergleichsparameter zum auffinden des Eintrags , , mongo <query> Object
    * @param updateparameters - Parameter die durch diese Operation geändert werden sollen
    */
    updateDocument:function(collection,searchparameters,updateparameters,callback){

        console.log("Trying to update a Document in the " + collection + " collection.");
        console.log("Updateparameters: ");
        inspect(updateparameters);

        dienstgeber.db.collection(collection).findOneAndUpdate(searchparameters,updateparameters,{returnOriginal: false},function(error,result){
            if(error){
                throw new Error("Fehler beim Update eines Dokuments");
            }

            else{
                console.log("Result of the update:  \n");
                inspect(result);
                callback(result.value);
            }
        });
    },

    /*
    * Ändert ein Dokument aus mongoDB
    * @param collection - name der collection {string}
    * @param searchparameters - Vergleichsparameter zum auffinden des Eintrags , , mongo <query> Object
    * @param replacementdocument - Dokument dass das gefundene ersetzen soll
    */
    replaceDocument:function(collection,searchparameters,replacementdocument,callback){
        dienstgeber.db.collection(collection).findOneAndReplace(searchparameters,replacementdocument,{returnOriginal:false},function(error,result){
            if(error){
                throw new Error("Fehler beim Ersetzen eines Dokumentes aus der " + collection + "collection");
            }
            else{
                inspect(result);
                callback(result.value);
            }
        });
    },

    /*
    *Löscht ein Dokument aus mongoDB
    * @param collection - name der collection {string}
    * @param parameters - Vergleichsparameter zum auffinden des Eintrags 
    */
    deleteDocument:function(collection,searchparameters,callback){

        dienstgeber.db.collection(collection).deleteOne(searchparameters,function(err, result) {

            console.log("Trying to delete a Document in the " + collection + " collection.");
            console.log("Searchparameters: ");
            inspect(searchparameters);

            //Frage ab ob ein Eintrag gelöscht wurde, n== Anzahl gelöschter Einträge 
            if(result.result.n==1){
                callback(true);
            }

            else{
                callback(false);
            }
        });
    },

    /*
    *Prüft ob der Content Type verarbeitet werden kann , antwortet mit 415 bei Misserfolg
    *@param req - request object 
    *@param res - response object
    */
    checkContent:function(req,res){

        var contentType = req.get('Content-Type');
        if (contentType != "application/json") {
            res.set("Accepts", "application/json").status(415).end(); 
        } 
    },

    /* 
    * Setzt aus dem Ressourcennamen und einer id eine URI zusammen 
    *@param type - Typ der Ressource (Benutzer,Sammelatkion ...)
    *@param id - ID der Ressource in der URI
    */
    generateLink:function(type,id){
        switch(type){

            case 'benutzer':
                return 'Benutzer/'+id;
                break;

            case 'situation':
                return 'Benutzer/'+id+'Situation';
                break;

            case 'vorschlaege':
                return 'Benutzer/'+id+'/Situation/Vorschlaege';
                break;

            case 'sammelaktion':
                return 'Sammelaktion/'+id;
                break;

            case 'angebot':
                return 'Angebot/'+id;
                break;

            case 'tafelverein':
                return 'Tafelverein/'+id;
                break;

            case 'lager':
                return 'Lager/'+id;
                break;

            default:
                return 'Unsupported Type'
        }
    },

    /* 
    * Generiert eine neue ID in der mit <name> angegebenen Sequence, genutzt um atomar Ids zu erhöhen und duplikate zu vermieden
    * @param Name - Name der Sequence , wird bei Startup in dienstgeber.js generiert 
    * Quelle dieses Vorgehens: /https://docs.mongodb.org/v3.0/tutorial/create-an-auto-incrementing-field/
    */
    getNextSequence: function(name,callback) {

        dienstgeber.db.collection('counters').findAndModify(
            { _id : name },  // query object 
            [], //Sort Angabe wenn mehrere Matches gefunden wurden 
            { $inc: { sequence_value: 1 } }, //Operation 
            { "new" : true}, //Options , new:true gibt das modifizierte Objekt zurück
            function(err,doc) {
                if(err){
                    throw new Error("Error generating a SequenceId");
                }
                else{
                    callback(doc.value.sequence_value);
                }
            }
        );
    }

}

