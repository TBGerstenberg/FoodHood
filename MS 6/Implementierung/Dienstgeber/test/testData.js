//eyes modul für farbige Konsolenausgaben , maxlength : false hebt die Depth-level Grenze der Anzeige auf 
var inspect=require('eyes').inspector({maxLength: false});

var current_date = new Date();

current_date.setHours(current_date.getHours()+10);
inspect(current_date.toISOString());