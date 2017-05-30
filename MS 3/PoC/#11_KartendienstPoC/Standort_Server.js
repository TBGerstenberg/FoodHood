global.express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var bodyParser = require('body-parser');
app.use(bodyParser.json());

app.post('/', function(req, res) {
    console.log("Standort erhalten !");
    res.status(201).json(req.body).end();
});

app.listen(3000, function() {
    console.log("Server listens on Port 3000.");
});