var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');


app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public'));


var rooms = [];
app.use('/', require('./routes/index')(io, rooms));
require('./socketio.js')(io, rooms);


http.listen(3000, function() {
	console.log('Server is a go on port 3000');
});
