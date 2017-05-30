global.express = require('express');

var http = require('http');
var pubnub = require('pubnub');
var app = express();
var server = http.createServer(app);


//Initialisiren
var PUBNUB_demo = pubnub.init({
    publish_key: 'pub-c-4086ea86-8bbb-4597-aee3-8f6a7bda621c',
    subscribe_key: 'sub-c-b991972e-8460-11e5-a558-0619f8945a4f'
});

PUBNUB_demo.subscribe({
        channel: 'MyChannel',
        message: function(m){console.log(m)},
});

app.listen(3000, function() {
    console.log("Server listens on Port 3000.");
});