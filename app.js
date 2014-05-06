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

var players = {};
var games = {};
var totalNumberOfPlayers = 0;

var characters = {
    village : {
        villager: {
            name: "villager",
            about: "A simple villager"
        },
        cop: {
            name: "cop",
            about: "Gets the reports"
        }
    },
    mafia : {
        mafia: {
            name: "mafia",
            about: "Kills villagers at night"
        }
    }
};

var set = [characters.village.villager, characters.village.cop];
//, characters.mafia.mafia

io.sockets.on('connection', function (socket) {

        socket.on("add user", function(username){
            socket.username = username;
            //Create new player object named socket.id
            players[socket.id] = {};
            players[socket.id].username = socket.username;

            //Check the number of players in the game
            totalNumberOfPlayers = Object.keys(players).length;

            //Check if the game is ready to start
            check();
            io.sockets.emit('in room', socket.username);
        });

        socket.on("send message", function(message){
            io.sockets.emit("received message", socket.username, message);
        });

        socket.emit("list of players", function(){
            var nicknames = [];
            for (var key in players) {
              if (players.hasOwnProperty(key)) {
                nicknames.push(players[key].username);
              }
            }
                return nicknames;
        }());

    var check = function(){
        if(totalNumberOfPlayers >=1){
            //Pseudo-random sort
            set.sort(function(){
                return  Math.round(Math.random());
            });
            io.sockets.clients().forEach(function(s, i) {
                s.emit('start game', set[i]);
            });
         }

    };

});