'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;


app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public'));


app.disable('x-powered-by');
app.use(function(req, res, next) {
	res.header({
		'X-Frame-Options': 'deny',
		'X-XSS-Protection': '1; mode=block',
		'X-Content-Type-Options': 'nosniff',
	});
	next();
});


MongoClient.connect('mongodb://localhost:27017/veto-chat', function(err, db) {
	if (err) {
		throw err;
	}

	require('./routes/index')(app, io, db);
	require('./socketio.js')(io, db);
});


http.listen(3000, function() {
	console.log('Server is a go on port 3000');
});
