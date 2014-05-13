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


//GAME ID
var gameID = 0;

//List of all players
var players = {};
//List of all active games
var game = {};

//Number of players
var totalNumberOfPlayers = 0;

//Object containing the characters to choose from
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
//, characters.mafia.mafia

//Contains the votes
var votes = [];


var timeout;

io.sockets.on('connection', function (socket) {


    /*
        This function checks wheter there is sufficient number of
        players to start the game, if there is the game set is sorted
        in order to give players diffrent characters, otherwise they would
        get the characters based on the order they joined in.
        Each socket is assigned a character and is notified the game is starting
    */
    var startGame = function(){
        //Pseudo-random sort
        set.sort(function(){
            return  Math.round(Math.random());
        });
        io.sockets.clients().forEach(function(s, i) {
            players[s.id].side = set[i].side;
            players[s.id].name = set[i].name;
            // console.log(s.id);
            s.emit('start game', set[i]);
           // console.log(io.sockets.clients()[0].name + " HEEEEEEEEEELOOOOOOOOOO");
        });
    };

    /*
       This function counts the players upon a kill vote
       and later passes the result to the killVote function
       to determine whether the number of votes is equal to the
       number of players that may participate in the voting
       CHANGE
    */
    var countPlayers = function(){
        var mafiaCount = 0;
        var allCount = 0;
            for (var key in players) {
                if (players.hasOwnProperty(key)) {
                    //console.log(players[key]);
                    if(players[key].side === 'mafia'){
                        mafiaCount++;
                        console.log(players[key].username + "    " + players[key].side);
                    }
                    allCount++;
                }
            }
        return [mafiaCount, allCount];
    };

    /*
        CHANGE && UPDATE
    */
    var killVote = function(count){
        var votesCasted = 0;
        var votes = [];
            for (var key in players) {
                if (players.hasOwnProperty(key)) {
                    if(players[key].vote !== ""){
                        votes.push(players[key].vote);
                        votesCasted++;
                    }
                }
            }
        if(votesCasted===count?true:false){
            //kill player here, emit he has been killed
        }
    };

    var clearVotes = function(){
        for (var key in players) {
            if (players.hasOwnProperty(key)) {
                players[key].vote = "";
            }
        }
    };

        //If the player disconnects he is killed and removed from the players list
        socket.on("disconnect", function(){
            io.sockets.emit("player disconnected", socket.username);
            delete players[socket.id];
            //Clear the game timeout
            clearTimeout(timeout);
        });

        //Player is created and added to the players list
        socket.on("add user", function(username){
            var joined = false;
            socket.username = username;
            //Create new player object named socket.id
            players[socket.id] = {};
            players[socket.id].username = socket.username;
            players[socket.id].alive = true;
            players[socket.id].vote = "";


            //ROOM Testing and player storing changes
            for(var room in game){
                if(!room.running){
                    socket.join(room);
                    joined = true;
                }
            }

            if(!joined){
                socket.join(gameID);
                game[gameID] = {
                    running : false,
                    players : {
      
                    }
                };

                game[gameID].players[socket.id] = {
                    username : username
                };
                gameID++;
            }

            //console.log(io.sockets.clients('1'));

            for (var key in game) {
                if (game.hasOwnProperty(key)) {
                    console.log(game[key].players);
                    for(var p in game[key].players){

                    }
                }
            }

            //ROOM Testing


            //Check the number of players in the game
            totalNumberOfPlayers = Object.keys(players).length;

            /*
                Check if the game is ready to start,
                apply timeout so players may get ready
                if someone leaves the room, clear the timeout            
            */
            if(totalNumberOfPlayers >=4){
                timeout = setTimeout(function() {
                    console.log("Game started");
                    startGame();
                }, 10);
                console.log("Game will start in 10 seconds");
            }
            //Notify players, a new player has joined
            io.sockets.emit('new player joined', socket.username);
        });

        //Message socket
        socket.on("send message", function(message){
            io.sockets.emit("received message", socket.username, message);
        });

        //Send the joining client the list of players
        socket.emit("on join list players", function(){
            var nicknames = [];
            for (var key in players) {
              if (players.hasOwnProperty(key)) {
                nicknames.push(players[key].username);
              }
            }
                return nicknames;
        }());

        socket.on("kill vote", function(vote){
            players[socket.id].vote = vote;
            //console.log(players[socket.id].vote);
            //console.log(countMafia()[0] + "     " + countMafia()[1]);
            killVote(countPlayers()[0]);
        });

});