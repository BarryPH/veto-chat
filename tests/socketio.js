'use strict';

var expect = require('chai').expect;
var mocha = require('mocha');
var io = require('socket.io-client');

describe('socketio', function() {
	var client;
	var options = {
		transports: ['websocket'],
		'force new connection': true,
		query: 'roomId=testId&roomName=testName',
	};


	beforeEach(function() {
		client = io.connect('http://localhost:3000', options);
	});

	afterEach(function() {
		client.disconnect();
	});


	it('sends messages', function(done) {
		client.on('userMessage', function(data) {
			expect(data.message).to.equal('Hello World');
			done();
		});

		client.emit('userMessage', 'Hello World');
	});


	it('changes username', function(done) {
		client.on('usernameChanged', function(data) {
			var username = data.username;

			expect(username).to.equal('Seth');
			done();
		});

		client.emit('usernameChange', 'Seth');
	});


	it('doesn\'t change taken usernames', function(done) {
		var runCount = 0;

		client.on('usernameChanged', function(data) {
			runCount++;

			if (runCount >= 2) {
				expect(data).to.equal(null);
				done();
			}
		});

		client.emit('usernameChange', 'Seth');
		client.emit('usernameChange', 'Seth');
	});


	it('doesn\'t change blank usernames', function(done) {
		client.on('usernameChanged', function(data) {
			expect(data).to.equal(null);
			done();
		});

		client.emit('usernameChange', '');
	});


	it('creates poll', function(done) {
		client.on('newPoll', function(data) {
			expect(data).to.not.equal(null);
			done();
		});

		client.emit('newPoll', {
			type: 'roomName',
			name: 'testRoomName',
			votes: {
				yes: 1,
				no: 0,
			},
		});
	});


	it('doesn\'t create poll when one already exists', function(done) {
		client.on('newPoll', function(data) {
			expect(data).to.equal(null);
			done();
		});

		client.emit('newPoll', {
			type: 'roomName',
			name: 'testRoomName',
			votes: {
				yes: 1,
				no: 0,
			},
		});
	});


	it('handles votes', function(done) {
		var runCount = 0;
		client.on('vote', function(data) {
			++runCount;

			if (runCount === 1) {
				expect(data.value).to.equal(true);
				expect(data.notInitialVote).to.equal(false);
			} else if (runCount === 2) {
				expect(data.value).to.equal(false);
				expect(data.notInitialVote).to.equal(true);
			} else if (runCount >= 3) {
				expect(data).to.equal(null);
				done();
			}
		});

		client.emit('vote', true);
		client.emit('vote', false);
		client.emit('vote', false);
	});
});
