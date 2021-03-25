const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { startPackage } = require('./deck');




const { startTimer, clearInterval } = require('./Timer/timer');


const PORT = process.env.PORT || 5002;

const router = require("./router.js");
const { Socket } = require("dgram");
const { start } = require("repl");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

let room = [];
let playerOnTurn;
let playerNotOnTurn;
app.use(router);

const switchTurn = () => {
    [playerOnTurn, playerNotOnTurn] = [playerNotOnTurn, playerOnTurn];
}

io.on('connection', socket => {


    socket.on('join', () => {
        console.log('player joined');
        if (room.length < 2) room = [...room, socket.id];

        if (room.length === 2) {
            //signal to both players, who starts, send deck to each player than a copy of opponent starting hand
            /* 
                SEND: DECK, STARTING HAND OF EACH PLAYER
            */

            let package = startPackage();
            playerNotOnTurn = room[0];
            playerOnTurn = room[1];
            io.to(playerNotOnTurn).emit('startGame', { start: 'no', user: package.user1, opponentHand: package.user2.hand });
            io.to(playerOnTurn).emit('startGame', { start: 'yes', user: package.user2, opponentHand: package.user1.hand });

            startTimer(30000, (action) => {
                if (action === 'turnEnding') {
                    console.log('turnEnding')
                    io.to(playerOnTurn).emit('turnEnding');
                } else if (action === 'endTurn') {
                    console.log('endturn')

                    io.to(playerOnTurn).emit('endTurn');
                    io.to(playerNotOnTurn).emit('startTurn');
                    switchTurn();
                }
            });

        }
    });

    socket.on('endTurn', () => {
        io.to(playerNotOnTurn).emit('startTurn');
        switchTurn();
        startTimer(30000, (action) => {
            if (action === 'turnEnding') {
                console.log('turnEnding')
                io.to(playerOnTurn).emit('turnEnding');
            } else if (action === 'endTurn') {
                console.log('endturn');
                io.to(playerOnTurn).emit('endTurn');
                io.to(playerNotOnTurn).emit('startTurn');
                switchTurn();
            }
        });
    });

    socket.on('minionPlayed', ({ board, hand, cardID }) => {
        console.log('minion played')
        socket.broadcast.emit('opponentPlaysMinion', { board, hand, cardID });
    });

    socket.on('spellPlayed', ({ cardID }) => {
        socket.broadcast.emit('opponentPlaysSpell', { cardID });
    });

    socket.on('cardDraw', ({ cards }) => {
        socket.broadcast.emit('cardDraw', { cards });
    });

    socket.on('heroDamaged', ({ newHeroHealth }) => {
        socket.broadcast.emit('heroDamaged', { newHeroHealth });
    });

    socket.on('battleResult', ({ atkBoard, defBoard, atkGrave, defGrave }) => {
        socket.broadcast.emit('battleResult', { atkBoard, defBoard, atkGrave, defGrave });
    });


    socket.on("disconnect", () => {
        room = room.filter(id => id !== socket.id);

        console.log('socket disconnected', room)
    });

});



server.listen(PORT, () => {
    console.log("server has started on port", PORT);
});


