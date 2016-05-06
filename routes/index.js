'use strict';

var router = require('express').Router();

module.exports = function(app, io, db) {
function checkError(err) {
	if (err) {
		throw err;
	}
}

var s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function randomString(n) {
	return Array(n).join().split(',').map(function() {
		return s.charAt(Math.floor(Math.random() * s.length));
	}).join('');
}

function generateRoomId (callback) {
	var randomId = randomString(10);
	db.collection('rooms').findOne({ roomId: randomId }, (err, room) => {
		checkError(err);

		if (room !== null) {
			callback(generateRoomId());
			return;
		}

		callback(randomId);
	});
}

function createRoom(roomData, callback) {
	if (!roomData.roomId) {
		generateRoomId((roomId) => {
			roomData.roomId = roomId;
			if (!roomData.roomName) {
				roomData.roomName = roomData.roomId;
			}

			db.collection('rooms').insertOne(roomData, (err, room) => {
				checkError(err);
				callback(roomData);
			});
		});
		return;
	}

	if (!roomData.roomName) {
		roomData.roomName = roomData.roomId;
	}

	db.collection('rooms').insertOne(roomData, (err, room) => {
		checkError(err);
		callback(roomData);
	});
}


router.route('/')
	.get(function(req, res) {
		res.render('index.ejs');
	});

router.route('/create')
	.post(function(req, res) {
		if (!req.body.roomName) {
			createRoom({}, (fullRoomData) => {
				res.redirect('/chatRoom/' + fullRoomData.roomId);
			});
			return;
		}

		db.collection('rooms').findOne({ roomName: req.body.roomName }, (err, room) => {
			checkError(err);

			if (room !== null) {
				res.render('index.ejs', {
					message: 'That name if taken.'
				});
				return;
			}

			var roomData = {
				roomName: req.body.roomName,
			};


			createRoom(roomData, (fullRoomData) => {
				res.redirect('/chatRoom/' + fullRoomData.roomId);
			});
		});
	});

router.route('/join')
	.post(function(req, res) {
		if (!req.body.roomName) {
			res.render('index.ejs', {
				message: 'Room name can\'t be blank'
			});
			return;
		}

		db.collection('rooms').findOne({ roomName: req.body.roomName }, (err, room) => {
			checkError(err);

			if (room !== null) {
				res.redirect('/chatRoom/' + room.roomId);
				return;
			}

			res.render('index.ejs', {
				message: 'No room found with that name'
			});
		});
	});

router.route('/chatRoom/:roomId')
	.get(function(req, res) {
		var roomId = req.params.roomId;
		db.collection('rooms').findOne({ roomId: roomId }, (err, room) => {
			checkError(err);

			var roomData = {
				roomId,
				roomName : room ? room.roomName : roomId,
			};

			if (room === null) {
				createRoom(roomData, (fullRoomData) => {
					res.render('chatRoom.ejs', fullRoomData);
				});
				return;
			}

			res.render('chatRoom.ejs', roomData);
		});
	});

app.use('/', router);
};
