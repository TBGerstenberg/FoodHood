//MomentJS-Modul für komfortablen Umgang mit Datetime-Strings
moment=require('moment');

//MomentJS-Range Erweiterung um Berechnungen auf Zeitintervallen durchzuführen 
moment_range=require('moment-range');

//assert Modul für Unit tests 
assert=require('assert');

//eyes modul für farbige Konsolenausgaben , maxlength : false hebt die Depth-level Grenze der Anzeige auf 
inspect=require('eyes').inspector({maxLength: false});

//async Modul für übersichtliches abwickeln mehrerer asynchroner Operationen 
async=require('async');

var angebot1 = {
    moeglicheAbholzeiten:[{
        "von": "2015-12-09T07:00:00.000Z",
        "bis": "2015-12-09T09:00:00.000Z"
    }]
}


//Ankunftszeitpunkt und MatchenderTermin fallen exakt zusammen
var zeitpunkt1="2015-12-09T07:00:00.000Z";
var matchenderTermin1= findeMatchendenTermin(angebot1,zeitpunkt1,function(match){   
    inspect(match);
    if(match){
        console.log("Für Zeitpunkt 1:");
        inspect(zeitpunkt1);
        inspect(match);
        
        assert.equal(match.von,zeitpunkt1);
        assert.equal(match.bis,angebot1.moeglicheAbholzeiten[0].bis)
    }
});

//Ankunftszeitpunkt liegt außerhalb Terminrange
//Gefundener Zeitraum muss null sein 
var zeitpunkt2="2015-12-09T09:30:00.000Z";
var matchenderTermin2=findeMatchendenTermin(angebot1,zeitpunkt2,function(match){
    console.log("Für Zeitpunkt 2:");
    inspect(zeitpunkt2);
    inspect(match);
    assert.equal(match,null);
});

//Ankunftszeitpunkt liegt im Abholzeitraum ,aber nicht genau am Startzeitpunkt 
//Gefundener Zeitraum muss Ankunftszeit bis ende des Termins sein 
var zeitpunkt3="2015-12-09T08:30:00.000Z";
var matchenderTermin3=findeMatchendenTermin(angebot1,zeitpunkt3,function(match){
    console.log("Für Zeitpunkt 3:");
    inspect(zeitpunkt3);
    inspect(match);
    
    assert.equal(match.von,zeitpunkt3);
    assert.equal(match.bis,angebot1.moeglicheAbholzeiten[0].bis);
});

function findeMatchendenTermin(angebot,zeitpunkt,callback){

    console.log("Terminmatcher aufgerufen mit zeiten :");
    inspect(angebot.moeglicheAbholzeiten);

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

        //console.log("prüfe ob Zeitpunkt: "); inspect(zeitpunkt); console.log("In Abholzeitraum "); inspect(abholzeitraum.start._i); inspect(abholzeitraum.end._i); console.log("liegt"); console.log("Ergebnis : ");

        //Wenn der Ankunftszeitpunkt innerhalb des gefundenen Terminzeitraums liegt 
        if(abholzeitraum.contains(zuPrüfenderTermin)){

            console.log(true);
            inspect(abholzeitraum.start._i);
            inspect(abholzeitraum.end._i);

            //Merke index des Termins
            terminIndex = i;
        }
       
        i++;
        next();

    },function(err,result){    
        if(terminIndex != TERMIN_NOT_FOUND){
            //Baue einen Zeitraum zusammen der von dem Prüfzeitpunkt bis ende des Termins geht 
            callback({
                von:zeitpunkt,
                bis:angebot.moeglicheAbholzeiten[terminIndex].bis
            });
        }
        else{
            callback(null);
        }
    });
}