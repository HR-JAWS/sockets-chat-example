var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var clientArr = [];
var socketArr = [];
var roomnameArr = [];

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {

  // newClient joins server
  socket.on('new chatroom', function() {
    //send list of other users just to calling client
    socket.emit('new chatroom', clientArr);
  })

  // send newClient to other clients
  socket.on('add client', function(clientName) {
    var clientObj = {};
    clientObj.id = socket.id;
    clientObj.name = clientName;
    clientArr.push(clientObj);

    socketArr.push(socket);

    //emit to everyone but calling client (new users)
    socket.broadcast.emit('add client', clientObj);
    console.log(clientArr);
  });   

  // send message to all client's
  socket.on('chat message', function(dataObj) {
    io.emit('chat message', dataObj);
  });

  // send a game request to desired client
  socket.on('invite game', function(clickedId) {
    //send to individual socket id
    socket.broadcast.to(clickedId).emit('receive invite', socket.id);
  })

  // receive game invite response
  socket.on('invite response', function(inviteResObj) {
    if (inviteResObj.answer === 'Yes') {
      //create room
      var roomname = generateRoomname(inviteResObj.requestorId, socket.id);
      //join player2 (responder)
      socket.join(roomname);
      //join player1 (requestor)
      for (var i = 0; i < socketArr.length; i++) {
        if (socketArr[i].id === inviteResObj.requestorId) {
          socketArr[i].join(roomname);
        }
      }
      //send yes response to requestor
      io.to(roomname).emit('game created', roomname);
    } 
    // player2 rejected game invite
    else {
      // emit to player1 game rejected
      // emit to player2 game rejected
    }
  })

  // socket.on('disconnect', function() {

  // });

  socket.on('private message', function(dataObj) {
    io.sockets.in(dataObj.roomname).emit('private message', dataObj);
  })
})

http.listen(3000, function() {
  console.log('listening on *:3000');
});

// REFACTOR: could make object 
// {
//   player1:
//   player2:
//   name: player1 + player2
// }
var generateRoomname = function(player1ID, player2ID) {
  return player1ID + player2ID;
};



// TODAY:
// 1. Send data to specific client
// 2. React client
//   2.1: newClient joins and enters username
//   2.2: server receives newClient (socket.id and username)
//   2.3: other clients receive newClient object
//   2.4: newClient receives array of other client objects
//   2.5: clientA clicks "invite" on clientB (radio button)
//   2.6: P2P part (new room, socket.p2p)


//   2.10: on disconnect (remove element with corresponding socket.id)
//   2.11: broadcast to other clients the removal of that button (reassign state?)
// 2. P2P