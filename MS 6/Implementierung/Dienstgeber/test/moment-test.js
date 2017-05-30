//MomentJS-Modul für komfortablen Umgang mit Datetime-Strings
var moment=require('moment');

//MomentJS-Range Erweiterung um Berechnungen auf Zeitintervallen durchzuführen 
var moment_range=require('moment-range');

//eyes modul für farbige Konsolenausgaben , maxlength : false hebt die Depth-level Grenze der Anzeige auf 
global.inspect=require('eyes').inspector({maxLength: false});

var abholtermin1 =  {
    "von": "2015-12-09T06:00:00.000Z",
    "bis": "2015-12-09T09:00:00.000Z"
}

var abholtermin2 ={
    "von": "2015-12-09T07:00:00.000Z",
    "bis": "2015-12-09T10:00:00.000Z"
}

var abholtermin3 ={
    "von": "2015-12-09T08:00:00.000Z",
    "bis": "2015-12-09T09:00:00.000Z"
}

var abholtermin4 = {
    "von": "2015-12-09T07:00:00.000Z",
    "bis": "2015-12-09T09:00:00.000Z"
}

var situationsZeitraum ={
    "von": "2015-12-09T07:00:00.000Z",
    "bis": "2015-12-09T09:00:00.000Z"
}

//Bilde Zeiträume mit moment-range.js 
var zeitraum1=moment.range(abholtermin1.von,abholtermin1.bis);

var zeitraum2=moment.range(abholtermin2.von,abholtermin2.bis);

var zeitraum3=moment.range(abholtermin3.von,abholtermin3.bis);

var zeitraum4=moment.range(abholtermin4.von,abholtermin4.bis);

//var situationsZeitraum = moment.range(situationsZeitraum.von,situationsZeitraum.bis);

//Pseudocode 
var osrm_traveltime = 3000; //50 min

//kann das Minimum in der gegeben Zeit erreicht werden? 
var zeitpunktAmLetztenStandort = situationsZeitraum.von;

inspect(( new Date(situationsZeitraum.von).getTime()));

inspect(situationsZeitraum.intersect(zeitraum1));
inspect(situationsZeitraum);
