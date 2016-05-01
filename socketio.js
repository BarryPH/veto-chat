'use strict';

/*
 * Reference
 * ---------------
 * Emit to everyone
 *   io.to(roomId).emit('event', data);
 * Emit to everyone but sender
 *   socket.broadcast.to(roomId).emit('event', data);
 */

module.exports = function(io, rooms) {

// Helper Functions
function usernameTaken(username, clients) {
	return clients.indexOf(username) !== -1;
}

function roomClientNames(roomId) {
	var clientIds = Object.keys(io.sockets.adapter.rooms[roomId] || {});

	return clientIds.map(function(id) {
		return io.sockets.adapter.nsp.connected[id].username;
	});
}


function PollsFactory() {
	this.polls = [];

	this.exists = function(roomId) {
		for (var poll of this.polls) {
			if (poll.roomId === roomId) {
				return poll;
			}
		}
	};

	this.remove = function(roomId) {
		for (var i = 0; i < this.polls.length; i++) {
			if (this.polls[i].roomId === roomId) {
				this.polls.splice(i, 1);
			}
		}
	};

	this.update = function(poll) {
		for (var i = 0; i < this.polls.length; i++) {
			if (this.polls[i].roomId === poll.roomId) {
				this.polls[i] = poll;
			}
		}
	};
}


var PollsManager = new PollsFactory();


// Connectiton Handler
io.on('connection', function(socket) {
	var roomId = socket.handshake.query.roomId;
	var roomName = socket.handshake.query.roomName;

	var clients = roomClientNames(roomId);

	for (var i = 0; usernameTaken('Guest_' + i, clients); i++) {
	}
	var username = 'Guest_' + i;

	socket.join(roomId);
	socket.username = username;

	socket.emit('setup', {
		clients: clients,
		username: socket.username,
		roomName: roomName
	});

	socket.broadcast.to(roomId).emit('userConnected', socket.username);
	clients.push(username);

	
	function emitUserDisconnect() {
		socket.leave(roomId);
		io.to(roomId).emit('userDisconnect', socket.username);
	}

	function emitUserMessage(message) {
		io.to(roomId).emit('userMessage', {
			message: message,
			sender: socket.username
		});
	}

	function evaluateResults() {
		var poll = PollsManager.exists(roomId);
		var pollSuccess = poll.votes.yes > poll.votes.no;
		if (pollSuccess) {
			roomName = poll.name;
			io.to(roomId).emit('newRoomName', roomName);
		}

		var clientIds = Object.keys(io.sockets.adapter.rooms[roomId] || {});

		for (var id of clientIds) {
			io.sockets.connected[id].vote = undefined;
		}

		io.to(roomId).emit('pollResults', pollSuccess);
		PollsManager.remove(roomId);
	}

	function emitNewPoll(poll) {
		if (!poll ||
			PollsManager.exists(roomId)) {
			socket.emit('newPoll', null);
			return;
		}

		poll.roomId = roomId;
		poll.votes = {
			yes: 1,
			no: 0
		};
		poll.createdBy = socket.username;

		PollsManager.polls.push(poll);

		socket.vote = true;

		io.to(roomId).emit('newPoll', poll);
		setTimeout(evaluateResults, 10000);
	}

	function emitUserVote(vote) {
		var poll = PollsManager.exists(roomId);

		if (!poll) {
			return;
		}

		var previousVote = socket.vote;
		var notInitialVote = previousVote !== undefined && vote !== previousVote;

		if (vote === previousVote) {
			socket.emit('vote', null);
			return;
		} else if (vote) {
			socket.vote = true;
			poll.votes.yes++;
			
			if (notInitialVote) {
			  poll.votes.no--;
			}
		} else {
			socket.vote = false;
			poll.votes.no++;

			if (notInitialVote) {
			  poll.votes.yes--;
			}
		}

		PollsManager.update(poll);

		io.to(roomId).emit('vote', {
			value: vote,
			notInitialVote: notInitialVote
		});
	}

	function emitUsernameChange(username) {
		var clients = roomClientNames(roomId);

		if (username === '' || usernameTaken(username, clients)) {
			socket.emit('usernameChanged', null);
			return;
		}

		var oldUsername = socket.username;
		socket.username = username;

		io.to(roomId).emit('usernameChanged', {
			oldUsername,
			username
		});
	}

	socket.on('disconnect', emitUserDisconnect);
	socket.on('userMessage', emitUserMessage);
	socket.on('newPoll', emitNewPoll);
	socket.on('vote', emitUserVote);
	socket.on('usernameChange', emitUsernameChange);
});

return;

};
