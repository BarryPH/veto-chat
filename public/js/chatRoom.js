'use strict';

/*jslint browser: true */
/*global window, io, swal, roomInfo */

window.addEventListener('load', function() {
	var socket = io.connect(window.location.origin, {
		query: 'roomId=' + roomInfo.roomId + '&roomName=' + roomInfo.roomName
	});


	/* 
	 * Live elements used throughtout script
	 */

	var elements = {
		// Setup
		roomName: document.getElementById('roomName'),

		// Occupants
		usernameForm: document.getElementById('usernameForm'),
		occupantList: document.getElementById('occupantList'),

		// Chat
		chatForm: document.getElementById('chatForm'),
		messages: document.getElementById('messages'),

		// Votes
		occupantCount: document.getElementById('occupantCount'),
		votes: document.getElementById('votes'),
		changeRoomNameButton: document.getElementById('changeRoomNameButton'),

		// Not yet on DOM
		voteElement: undefined,
		yesVoteCounter: undefined,
		noVoteCounter: undefined
	};


	function updateOccupantCount() {
		var occupantCount = elements.occupantList.children.length;
		elements.occupantCount.innerText = '(' + occupantCount.toString() + ')';
	}


	function setup(data) {
		socket.username = data.username;
		elements.usernameForm.username.setAttribute('placeholder', socket.username);

		// Clear occupants already on the DOM in case server reset causes this
		// function to run again
		var children = elements.occupantList.children;
		for (var i = 1; i < children.length; i++) {
			children[i].parentElement.removeChild(children[i]);
		}

		for (var client of data.clients) {
			addClientToDOM(client);
		}

		updateOccupantCount();
		elements.roomName.textContent = data.roomName;
	}


	function addMessage(messageText, isServerMessage, sender) {
		var message = document.createElement('div');

		// Construct node
		if (isServerMessage) {
			message.classList.add('serverMessage');
		} else {
			var senderDiv = document.createElement('span');
			var senderTextNode = document.createTextNode(sender + ': ');
			senderDiv.appendChild(senderTextNode);
			senderDiv.classList.add('prefix');
			message.appendChild(senderDiv);
		}

		var elem = elements.messages;
		var scrolledToBottom = elem.scrollTop === (elem.scrollHeight - elem.offsetHeight);

		// Add to DOM
		var messageTextNode = document.createTextNode(messageText);
		message.appendChild(messageTextNode);
		elements.messages.appendChild(message);

		if (scrolledToBottom) {
			elements.messages.scrollTop = elements.messages.scrollHeight;
		}
	}


	function addClientToDOM(client) {
		var clientDiv = document.createElement('div');
		clientDiv.classList.add('occupant');
		clientDiv.appendChild(document.createTextNode(client));
		elements.occupantList.appendChild(clientDiv);
		updateOccupantCount();
	}


	function removeClientFromDOM(client) {
		for (var clientDiv of elements.occupantList.children) {
			if (clientDiv.textContent === client) {
				clientDiv.parentElement.removeChild(clientDiv);
				break;
			}
		}

		updateOccupantCount();
	}


	function addUserMessage(data) {
		addMessage(data.message, false, data.sender);
	}

	function handleUserConnect(client) {
		addClientToDOM(client);
		addMessage(client + ' has connected', true);
	}

	function handleUserDisconnect(client) {
		removeClientFromDOM(client);
		addMessage(client + ' has disconnected', true);
	}


	function voteYes(event) {
		event.currentTarget.classList.add('selected');
		event.currentTarget.nextElementSibling.classList.remove('selected');
		socket.emit('vote', true);
	}


	function voteNo(event) {
		event.currentTarget.classList.add('selected');
		event.currentTarget.previousElementSibling.classList.remove('selected');
		socket.emit('vote', false);
	}


	function addPoll(poll) {
		if (poll === null) {
			return;
		}

		var votesWrapperDiv = document.createElement('div');
		votesWrapperDiv.className = 'voteWrapper';

		var voteDiv = document.createElement('div');
		voteDiv.className = 'vote';

		var titleDiv = document.createElement('div');
		titleDiv.className = 'title';

		if (poll.type === 'roomName') {
			titleDiv.textContent = 'Change room name to: ' + poll.name;
		}

		var yesButton = document.createElement('button');
		yesButton.className = 'yes';
		yesButton.textContent = poll.votes.yes;

		if (poll.createdBy === socket.username) {
			yesButton.classList.add('selected');
		}

		var noButton = document.createElement('button');
		noButton.className = 'no';
		noButton.textContent = poll.votes.no;

		voteDiv.appendChild(titleDiv);
		voteDiv.appendChild(yesButton);
		voteDiv.appendChild(noButton);
		votesWrapperDiv.appendChild(voteDiv);
		elements.votes.insertBefore(votesWrapperDiv, elements.votes.firstChild);

		yesButton.addEventListener('click', voteYes);
		noButton.addEventListener('click', voteNo);

		elements.voteElement = document.getElementsByClassName('vote')[0];
		elements.yesVoteCounter = document.getElementsByClassName('yes')[0];
		elements.noVoteCounter  = document.getElementsByClassName('no')[0];
	}


	function setPollResults(success) {
		elements.voteElement.classList.add(success ? 'successfull' : 'unsuccessfull');
		elements.yesVoteCounter.removeEventListener('click', voteYes);
		elements.noVoteCounter.removeEventListener('click', voteNo);
	}


	function updateVotes(vote) {
		if (vote === null) {
			return;
		}

		if (vote.value) {
			if (vote.notInitialVote) {
				elements.noVoteCounter.textContent = parseInt(elements.noVoteCounter.textContent, 10) - 1;
			}
			elements.yesVoteCounter.textContent = parseInt(elements.yesVoteCounter.textContent, 10) + 1;
		} else {
			if (vote.notInitialVote) {
				elements.yesVoteCounter.textContent = parseInt(elements.yesVoteCounter.textContent, 10) - 1;
			}
			elements.noVoteCounter.textContent = parseInt(elements.noVoteCounter.textContent, 10) + 1;
		}
	}


	function updateRoomName(roomName) {
		elements.roomName.textContent = roomName;
	}


	function usernameChanged(data) {
		if (data === null) {
			return;
		}

		var {success, oldUsername, username} = data;

		if (oldUsername === socket.username) {
			socket.username = username;
			elements.usernameForm.username.value = '';
			elements.usernameForm.username.setAttribute('placeholder', username);
		} else { 
			var occupantList = elements.occupantList.children;
			for (var i = 0; i < occupantList.length; i++) {
				if (occupantList[i].innerText === oldUsername) {
					occupantList[i].innerText = username;
					break;
				}
			}
		}

		addMessage(oldUsername + ' changed username to ' + username, true);
	}


	/*
	 * Handle Socket.io events
	 */
	socket.on('setup', setup);
	socket.on('userMessage', addUserMessage);
	socket.on('userConnected', handleUserConnect);
	socket.on('userDisconnect', handleUserDisconnect);
	socket.on('newPoll', addPoll);
	socket.on('pollResults', setPollResults);
	socket.on('vote', updateVotes);
	socket.on('newRoomName', updateRoomName);
	socket.on('usernameChanged', usernameChanged);



	/*
	 * EventListeners
	 */

	function startVoteChangeRoomName() {
		swal({
			title: 'Set a new room name',
			type: 'input',
			inputPlaceholder: 'Room name',
			confirmButtonText: 'Start Vote',
			showCancelButton: true
		}, function(roomName) {
			if (!roomName) {
				return;
			}

			var poll = {
				type: 'roomName',
				name: roomName,
				votes: {
					yes: 1,
					no: 0
				}
			};
			socket.emit('newPoll', poll);
		});
	}


	function sendUserMessage(event) {
		event.preventDefault();

		var message = document.getElementById('messageInput');
		if (message.value !== '') {
			socket.emit('userMessage', message.value);
			message.value = '';
		}
	}


	function toggleClientOptions(optionsDiv) {
		var optionDivs = document.getElementsByClassName('clientOptions');
		var index = [].indexOf.call(optionDivs, optionsDiv);

		for (var i = 0; i < optionDivs.length; i++) {
			if (i !== index) {
				optionDivs[i].style.display = 'none';
			}
		}

		if (optionsDiv.style.display === 'none' || optionsDiv.style.display === '') {
			optionsDiv.style.display = 'block';
		} else {
			optionsDiv.style.display = 'none';
		}
	}


	function requestNewUsername(event) {
		event.preventDefault();

		var username = elements.usernameForm.username.value;
		socket.emit('usernameChange', username);
	}


	elements.chatForm.addEventListener('submit', sendUserMessage);
	elements.changeRoomNameButton.addEventListener('click', startVoteChangeRoomName);
	elements.usernameForm.addEventListener('submit', requestNewUsername);
});
