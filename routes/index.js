'use strict';

var router = require('express').Router();

module.exports = function(app, io, rooms) {

function roomFromName(name) {
	for (var room of rooms) {
		if (room.name === name) {
			return room;
		}
	}
	return null;
}

function roomFromId(id) {
	for (var room of rooms) {
		if (room.id === id) {
			return room;
		}
	}
	return null;
}

var s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function randomString(n) {
	return Array(n).join().split(',').map(function() {
		return s.charAt(Math.floor(Math.random() * s.length));
	}).join('');
}

function generateRoomId () {
	var roomId;
	do {
		roomId = randomString(10);
	} while (roomFromId(roomId));
	return roomId;
}


router.route('/')
	.get(function(req, res) {
		res.render('index.ejs');
	});

router.route('/create')
	.post(function(req, res) {
		if (req.body.roomName && roomFromName(req.body.roomName)) {
			res.render('index.ejs', {
				message: 'That name if taken.'
			});
			return;
		}

		var roomId = generateRoomId();
		var room = {
			id: roomId,
			name: req.body.roomName || roomId,
		};
		rooms.push(room);

		res.redirect('/chatRoom/' + room.id);
	});

router.route('/join')
	.post(function(req, res) {
		if (!req.body.roomName) {
			res.render('index.ejs', {
				message: 'Room name can\'t be blank'
			});
			return;
		}

		var room = roomFromName(req.body.roomName);
		if (room) {
			res.redirect('/chatRoom/' + room.id);
			return;
		}

		res.render('index.ejs', {
			message: 'No room found with that name'
		});
	});


router.route('/chatRoom/:roomId')
	.get(function(req, res) {
		var roomId = req.params.roomId;
		var room = roomFromId(roomId);
		var roomName = room ? room.name : roomId;

		if (!room) {
			rooms.push({
				id: roomId,
				name: roomName
			});
		}

		res.render('chatRoom.ejs', {
			roomId,
			roomName
		});
	});

app.use('/', router);

};
