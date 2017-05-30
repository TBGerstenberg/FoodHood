//Soll den Dienstnutzer der Tafel simulieren, um die Kommunikation über RabbitMQ zwischen dem Dienstgeber, dem Android Client und dem Client
//für die Tafeln zu demonstrieren. 

//Definiere express modul für alle Routen 
global.express = require('express');

var amqp = require('amqplib/callback_api');

var app = express();

//Binde das Bodyparser Modul ein
var bodyParser = require('body-parser');
app.use(bodyParser.json());

//Zum RabbitMQ Server der auf dem localhost läuft verbinden
amqp.connect('amqp://localhost', function(err, conn) {
  conn.createChannel(function(err, ch) {
    
    //Die Postleitzahl für die die Tafel zuständig ist. 
    var name = '50668';
      
    // Create ein Exchange vo Typ Fanout mit dem namen der Postleitzahl für den die Tafel zuständig ist. 
    ch.assertExchange(name, 'fanout', {durable: false});
    
    ch.assertQueue(name, {exclusive: true}, function(err, q) {
      console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
      //Binding zwischen der queue und dem exchange herstellen
      ch.bindQueue(q.queue, name, '');

      ch.consume(q.queue, function(msg) {
        console.log(" [x] Sie haben eine Nachricht erhalten!: \n %s", msg.content.toString());
      }, {noAck: true});
    });
  });
});



