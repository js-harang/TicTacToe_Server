const { v4: uuidv4 } = require('uuid');

module.exports = function(server) {
    
    const io = require('socket.io')(server, {
        transports: ['websocket']
    });

    // 방 정보
    var rooms = [];
    var socketRooms = new Map();

    io.on('connection', function(socket) {
        console.log('Connected: ' + socket.id);
        if (rooms.length > 0) {
            var rId = rooms.shift();
            socket.join(rId)
            socket.emit('joinRoom', { room: rId });
            socket.to(rId).emit('startGame', { room: rId });
            socketRooms.set(socket.id, rId);
        } else {
            var roomName = uuidv4();
            socket.join(roomName);
            socket.emit('createRoom', { room: roomName });
            rooms.push(roomName);
            socketRooms.set(socket.id, roomName);
        }

        socket.on('leaveRoom', function(roomData) {
            socket.leave(roomData.room);
            socket.emit('exitRoom');
            socket.to(roomData.room).emit('endGame');

            // 방 만든 후 혼자 들어갔다가 나갈 때 rooms에서 방 삭제
            var roomId = socketRooms.get(socket.id);
            const roomIdx = rooms.indexOf(roomId);
            if (roomIdx !== -1) {
                rooms.splice(roomIdx, 1);
                console.log('Room removed:', roomId);
            }

            socketRooms.delete(socket.id);
        });

        socket.on('disconnecting', function(reason) {
            console.log('Disconnected: ' + socket.id + ', Reason: ' + reason);
        });

        socket.on('doPlayer', function(playerInfo) {
            var roomId = playerInfo.room;
            var cellIndex = playerInfo.position;

            console.log('doPlayer: ' + roomId + ' ' + cellIndex);
            socket.to(roomId).emit('doOpponent', { position: cellIndex });
        });

        socket.on('sendMessage', function(message) {
            console.log('sendMessage: ' + message.roomId + ' ' + message.nickName + ' ' + message.message);
            socket.to(message.roomId).emit('recievedMessage', { nickName: message.nickName, message: message.message });
        });
    });
};
