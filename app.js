var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var index = require('./routes/index');
var http = require('http');
var path = require('path');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(80);


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.cookieParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("bower_components"));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/mafia', index.mafia);
app.get('/village', index.village);



var characters = {
    village : {
        villager: {
            name: "villager",
            about: "A simple villager",
            side: "village"
        },
        cop: {
            name: "cop",
            about: "Gets the reports",
            side: "village"
        }
    },
    mafia : {
        mafia: {
            name: "mafia",
            about: "Kills villagers at night",
            side: "mafia"
        }
    }
};

//Predefined game set
var set = [characters.village.villager, characters.mafia.mafia];
//, characters.village.cop];
//, characters.mafia.mafia




//This object stores all of the games
var games = {};
var roomID = 0;
var timeOuts = [];



io.sockets.on('connection', function (socket) {
console.log("THIS IS SOCKET ID   ");
console.log(socket.id);
console.log(" HEEEEEEEEREEE ");

        socket.on("disconnect", function(){
            //Check if player has joined any room before removing him from one
            if(typeof socket.room !== 'undefined'){
                //Count the number of players in the room
                var nP;
                nP = Object.keys(games[socket.room].players).length;

                //Notify players in the room a player has disconnected
                socket.leave((socket.room).toString());
                io.sockets.in((socket.room).toString()).emit("player disconnected", socket.username); 
                console.log(socket.username + " disconnected from room " + socket.room);
                console.log("Number of players in room number " + socket.room + " : " + (nP-1));


                //Check if game is starting, if it is stop the timeout
                //else the game goes on with one less player
                if(games[socket.room].isStarting){
                    games[socket.room].isStarting = false;
                    clearTimeout(timeOuts[socket.room]);
                    console.log("Game has been stopped in room " + socket.room);
                }

                //If this is the last player in the room, remove the room from the game list
                //else remove only the player that has left
                if(nP<=1){
                    console.log("Room number " + socket.room + " has been closed");
                    delete games[socket.room];
                }else{
                    delete games[socket.room].players[socket.id];
                }
            }
        });


        //Player is created and added to the players list
        socket.on("add user", function(username){
            var joined = false;
            socket.username = username;

            //Iterate over rooms, find room where game is not running, else create new
            for(var room in games){
                if(games.hasOwnProperty(room)){
                    // console.log(games[room].started);
                    // console.log(!games[room].isStarting && !games[room].started);
                    if(!games[room].isStarting && !games[room].started && !joined){
                        socket.join(room.toString());
                        games[room].players[socket.id] = {
                            username : username
                        };
                        socket.room = room;
                        joined = true;
                    }
                }
            }

            //Create new room if all are full
            if(!joined){
                games[roomID] = {
                    started : false,
                    isStarting : false,
                    players : {

                    }
                };

                games[roomID].players[socket.id] = {
                    username : username
                };

                socket.room = roomID;
                socket.join((socket.room).toString());
                //Creating new id for the next user that won't be able to join
                roomID++;
            }

            console.log("Socket joined room " + socket.room);
            console.log("List of rooms ");
            console.log(io.sockets.manager.roomClients[socket.id]);

            // Notify players in the room, a new player has joined
            socket.broadcast.to((socket.room).toString()).emit('new player joined', socket.username);
            
            //Get list of players upon joining the room
            emitListOfPlayers((socket.room).toString());

            //Check if the game is ready to start
            checkIfReady(io.sockets.clients(socket.room).length);

        });

        var emitListOfPlayers = function(socketRoom){
            //Send the joining client the list of players
            socket.emit("on join list players", function(){
                var nicknames = [];
                for(var room in games) {
                    if (games.hasOwnProperty(room)) {
                        console.log("ROOOM " + room + " SOCKETROOM " + socketRoom);
                        if(room === socketRoom){
                                                                            console.log(" I  AM                  INSIDE");
                            for(var p in games[room].players){
                                nicknames.push(games[room].players[p].username);
                                console.log("SERVER USERNAME  " + games[room].players[p].username);
                            }
                        }
                    }
                }
                    return nicknames;
            }());
        };

    /*
        Check if the game is ready to start,
        apply timeout so players may get ready
        if someone leaves the room, stop the timeout            
    */
    var checkIfReady = function(players){
        if(players >= 2){
            games[socket.room].isStarting = true;
            //games[socket.room].timeout = timeout;
            timeOuts[socket.room] = setTimeout(function(){
                console.log("Game started in room " + socket.room);
                startGame(socket.room);
            }, 500000);
            console.log("Game will start in 20 seconds in room " + socket.room);
        }
    };

    /*
        Start the game, game is no longer in starting state
        Randomly sort the set of available roles and then
        assign them to the players
    */
    var startGame = function(room){
        games[socket.room].isStarting = false;
        games[socket.room].started = true;
        //Pseudo-random sort
        set.sort(function(){
            return  Math.round(Math.random());
        });

        //Set all the players roles in the room
        io.sockets.clients(room.toString()).forEach(function(s, i) {
            console.log("ROOM " + s.room + "  username " + s.username + " SIDE " + set[i].side);
            games[room].players[s.id].side = set[i].side;
            games[room].players[s.id].name = set[i].name;
            s.emit('start game', set[i]);
        });
    };

});