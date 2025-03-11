const { v4: uuidv4 } = require('uuid');

module.exports = function(server) {
    const io = require('socket.io')(server);

    var rooms = [];
    var socketRooms = new Map();

    io.on('connection', function(socket) {
        console.log('사용자가 연결 되었습니다.');

        if (rooms.length > 0) {
            var roomId = rooms.shift();
            socket.join(roomId);
            socket.emit('joinRoom', { roomId: roomId });
            socket.to(roomId).emit('startGame', { roomId: roomId });
            socketRooms.set(socket.id, roomId);
        } else {
            var roomId = uuidv4();
            socket.join(roomId);
            socket.emit('createRoom', { roomId: roomId });
            rooms.push(roomId);
            socketRooms.set(socket.id, roomId);
        }

        socket.on('leaveRoom', function(roomData) {
            socket.leave(roomData.roomId);
            socket.emit('exitRoom');
            socket.to(roomData.roomId).emit('endGame');

            // 방 만든 후 혼자 들어갔다가 나갈 때, rooms에서 해당 방 정보 삭제
            var roomId = socketRooms.get(socket.id);
            const roomIdx = rooms.indexOf(roomId);
            if (roomIdx !== -1) {
                rooms.splice(roomIdx, 1);
                console.log('방 삭제됨: ' + roomId);
            }
            socketRooms.delete(socket.id);
        });
        
        socket.on('doPlayer', function(moveData) {
            const roomId = moveData.roomId;
            const position = moveData.position;
            console.log('doPlayer 메시지를 받았습니다: ' + roomId + ' ' + position);
            socket.to(roomId).emit('doOpponent', { position: position });
        });

        socket.on('sendMessage', function(message) {
            console.log('메시지를 받았습니다: ' + message.roomId + ' ' + message.nickName + ' : ' + message.message);
            socket.to(message.roomId).emit('receiveMessage', { nickName: message.nickName, message: message.message });
        });

        socket.on('disconnect', function() {
            console.log('사용자가 연결을 끊었습니다.');
        });
    });
}
