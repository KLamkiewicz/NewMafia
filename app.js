var express = require("express");
var routes = require('./routes');
var index = require('./routes/index');
var app = express();
var path = require('path');
var httpServer = require("http").createServer(app).listen(80);
var socketio = require("socket.io");
var io = socketio.listen(httpServer);
var connect = require('connect');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var socketIo = require('socket.io');
var passportSocketIo = require('passport.socketio');
var sessionStore = new connect.session.MemoryStore();
var sessionSecret = 'jednorozec';
var sessionKey = 'connect.sid';

//REDIS
var redis = require("redis");
//var client = redis.createClient(10477, "pub-redis-10477.us-east-1-3.3.ec2.garantiadata.com");
var client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});


//username, password
var registration = function(username, password){
    client.get("id", function(err, reply){
        var currentId = 0;
        if(!reply){
            client.set("id", 0);
        }else{
            currentId = reply;
        }
        client.hmset(username, "password", password, "id", currentId);
        console.log(currentId);
        client.incr("id");
    }); 
};


// Konfiguracja passport.js
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

passport.use(new LocalStrategy(
    function (username, password, done) {        
        client.hgetall(username, function(err, reply){
            if(reply){
                if(password === reply.password){
                    console.log("Zalogowano poprzez REDIS uzytkownika " + username);
                    return done(null, {
                        username: username,
                        password: password
                    });
                }else{
                    return done(null, false, { message : "Wrong password" });
                }
                         
            }else{
                return done(null, false, { message : "No such user" } );
            }
        });
    }
));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.cookieParser());
app.use(express.urlencoded());
app.use(express.session({
    store: sessionStore,
    key: sessionKey,
    secret: sessionSecret
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("bower_components"));



app.get('/mafia', index.mafia);
app.get('/village', index.village);
app.get('/spectator', index.spectator);

app.get('/game', isAuthenticated, function(req, res){
    //res.sendfile(__dirname + '/public/index.html');
    //console.log(req.user.username);
    res.render('game', {name : req.user.username});
});

app.post('/login',
    passport.authenticate('local', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        //res.redirect('/authorized.html');
        res.send("HHH");
        //change to '/'
        res.redirect('/game');
    }
);

//isLoggedIn,
app.get('/login', isLoggedIn, function(req, res){
    res.render('login');
});

app.get('/register',isLoggedIn, function(req, res){
    res.render('register');
});

app.get('/', function(req, res){
    var html = "Hello";
    if(!req.user)
        html = '<a href="/login"> Zaloguj sie</a> ';
    else{
        html = '<a href="/game"> Zagraj</a>';
        //html +=
    }
    console.log(req.session.game);
    res.send(html);
}); 

app.post('/register',
    function (req, res) {
        //req.body.username;
        console.log("Registered");
        registration(req.body.username, req.body.password);
        //res.redirect('/login');
        res.redirect('/login');
        //res.end();
    }
);


function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) { 
        res.redirect('/');
    }else{
        return next();
    }
}

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

// function isRegistered(req, res, next) {
//   if (req.isAuthenticated()) { return next(); }
//   res.redirect('/register');
// }

var onAuthorizeSuccess = function (data, accept) {
    console.log('Udane połączenie z socket.io');
    accept(null, true);
};

var onAuthorizeFail = function (data, message, error, accept) {
    if (error) {
        throw new Error(message);
    }
    console.log('Nieudane połączenie z socket.io:', message);
    accept(null, false);
};


io.set('log level', 2);

//Adding User to handshake, which is accesible through socket.handshake.user
io.set('authorization', passportSocketIo.authorize({
    passport: passport,
    cookieParser: express.cookieParser,
    key: sessionKey, // nazwa ciasteczka, w którym express/connect przechowuje identyfikator sesji
    secret: sessionSecret,
    store: sessionStore,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
}));


//Available characters to choose from
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

//Predefined game set from the characters object
var set = [characters.village.villager, characters.mafia.mafia, characters.village.cop, characters.mafia.mafia];
//,characters.village.villager, characters.village.villager, characters.village.cop];

var PLAYERS_LENGTH = set.length;

//This object stores all of the games
var games = {};
var roomID = 0;
var timeOuts = [];


io.sockets.on('connection', function (socket) {

//Sockets
    var loginName = socket.handshake.user.username;

    var sessionID = socket.handshake.cookie['connect.sid'];


//SAVING TO SESSION
    // sessionStore.load(sessionID, function(err, session) {
    //     console.log("inside");
    //     session.current = { "start" : false};
    //     console.log(session);
    //     session.save();
    // });

    // };

        /*
            On this event firstly we check if the socket has joined any room
            before disconnecting (did not log in) if he did not then we don't
            to worry, else we must update our list of players in that room, notify
            all the players in the room that someone is a quitter and if necessary
            stop the game from starting. 
        */
        socket.on("disconnect", function(){
            //Check if player has joined any room before removing him from one
            if(typeof socket.room !== 'undefined'){
                //Count the number of players in the room
                var nP;
                nP = Object.keys(games[socket.room].players).length;

                //Notify players in the room a player has disconnected
                socket.leave((socket.room).toString());
                io.sockets.in((socket.room).toString()).emit("player disconnected", {name: socket.username, alive: socket.alive} ); 
                console.log(socket.username + " disconnected from room " + socket.room);
                console.log("Number of players in room number " + socket.room + " : " + (nP-1));


                //Check if game is starting, if it is stop the timeout
                //else the game goes on with one less player
                if(games[socket.room].isStarting){
                    games[socket.room].isStarting = false;
                    clearTimeout(timeOuts[socket.room]);
                    console.log("Game has been stopped in room " + socket.room);
                }

                if(games[socket.room].started && socket.alive){
                    nextRound((socket.room).toString());
                }

                //If this is the last player in the room, remove the room from the game list
                //else remove only the player that has left
                if(nP<=1){
                    console.log("Room number " + socket.room + " has been closed");
                    delete games[socket.room];
                }else{
                    //delete games[socket.room].players[loginName];
                    socket.alive = false;
                    games[socket.room].players[loginName].alive = false;
                }
            }
        });
 
        //Message socket
        socket.on("send message", function(message){
            io.sockets.in((socket.room).toString()).emit("received message", socket.username, message);
            console.log(games);
        });

        socket.on("dead message", function(message){
            var room = socket.room;
            io.sockets.clients(room.toString()).forEach(function(s, i) {
                if(!s.alive){
                    s.emit("received dead message", socket.username, message);
                }
            });
        });

        //Get list of players upon joining the room, wait for the game screen to be prepared
        socket.on("ready for list", function(){
            emitListOfPlayers((socket.room).toString());
        });

        /*
            In here the server decides which room the player will join
            First we check all available rooms, if there is no room that the player can join,
            a new one is created just for him.
        */
        socket.on("add user", function(username){
            username = socket.handshake.user.username;
            //console.log(sessionStore);
            console.log("HELLLO     " + username);

            
            var joined = false;
            socket.username = username;

            //Iterate over rooms, find room where game is not running, else create new
            for(var room in games){
                if(games.hasOwnProperty(room)){
                    // console.log(games[room].started);
                    // console.log(!games[room].isStarting && !games[room].started);
                    if(!games[room].isStarting && !games[room].started && !joined){
                        socket.join(room.toString());
                        games[room].players[loginName] = {
                            username : username,
                            alive: true,
                            vote : ""
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
                    day: false,
                    players : {

                    },
                };

                games[roomID].players[loginName] = {
                    username : username,
                    alive: true,
                    vote : ""
                };

                socket.room = roomID;
                socket.join((socket.room).toString());
                //Creating new id for the next user that won't be able to join
                roomID++;
            }
            socket.alive = true;

            emitListOfPlayers((socket.room).toString());
            console.log("Socket joined room " + socket.room);
            //console.log("List of rooms ");
            //console.log(io.sockets.manager.roomClients[socket.id]);

            // Notify players in the room, a new player has joined
            socket.broadcast.to((socket.room).toString()).emit('new player joined', socket.username);

            //Check if the game is ready to start
            checkIfReady(io.sockets.clients(socket.room).length);
        });


        socket.on("kill vote", function(vote){
            var count = 0;
            var day;
  
            console.log("kill " + vote);

            var room = socket.room;
            games[room].players[loginName].vote = vote;
            for(var p in games[room].players){
                day = games[room].day;
                if(!games[room].day){
                    if(games[room].players[p].side === 'mafia' && games[room].players[p].alive){
                        count++;
                    }
                }else{
                   if(games[room].players[p].alive){
                        count++;
                   }     
                }
            }

            console.log("ITS " + day + " number of allowed votes " + count);
            console.log("TEST ");
            console.log(games[socket.room].players);
            theKilling(count, false);
        });


//Functions

    var count = function(room){
        var count = 0;

            for(var p in games[room].players){
                day = games[room].day;
                if(!games[room].day){
                    if(games[room].players[p].side === 'mafia' && games[room].players[p].alive){
                        count++;
                    }
                }else{
                   if(games[room].players[p].alive){
                        count++;
                   }     
                }
            }
        return count;
    };
    
    var theKilling = function(count, isTimeout){
        var votesCasted = 0;
        var voteArray = [];
        var votes = {};
        var topVotes = {};
        var killed;

        for(var room in games){
            if(games.hasOwnProperty(room)){
                if(room === (socket.room).toString()){
                    for(var p in games[room].players){
                        if(games[room].players[p].vote !== ""){
                            votesCasted++;
                            voteArray.push(games[room].players[p].vote);
                        }
                    }
                }
            }
        }

        voteArray.forEach(function(el){
            if(el in votes){
                votes[el]++;
            }else{
                votes[el] = 1;
            }
        });

        console.log(votes);

        //Check if the votesCasted count equals the number of people allowed to vote
        if(votesCasted===count?true:false || isTimeout){
            console.log("BEFORE");
            console.log(games[socket.room].voteInterval);
            clearInterval(games[socket.room].voteInterval);
            console.log("AFTER ");
            //delete is slower than setting to undefined and variable is used later
            games[socket.room].voteInterval = undefined;
            console.log(games[socket.room].voteInterval);

            /*
                Check the votes
                Case: Tie - kill no one, you can't decide you can't kill
                Case: No one - kill no one
                Case: Player - kill player 
            */

            topVotes["no one"] = 0;

            for(var vote in votes){
                if(votes.hasOwnProperty(vote)){
                    console.log(vote + votes[vote]);
                    for(var topVote in topVotes){
                        if(topVotes.hasOwnProperty(topVote)){
                            if(votes[vote] > topVotes[topVote]){
                                topVotes[vote] = votes[vote];
                                delete topVotes[topVote];
                            }else if(votes[vote] === topVotes[topVote]){
                                topVotes[vote] = votes[vote];
                            }
                        }
                    }
                }
            }

            /*
                E.g. 3 votes on A, 2 votes on B, 2 votes on C
                A "wins", but the vote is not the majority so
                no one is killed
            */                      
            if(Object.keys(topVotes).length === 1){
                //This will only make one loop, because there is only one field in the object
                for(var n in topVotes){
                    /*jshint loopfunc: true */
                    //Kill this one
                    console.log("KILL");
                    console.log(n);
                    if((topVotes[n] / count) > 0.5){
                        console.log("Majority");
                        io.sockets.clients(room.toString()).forEach(function(s, i) {
                            if(s.username === n ){
                                games[s.room].players[s.username].alive = false;
                                s.alive = false;
                                s.emit("you are dead", "You have been killed");
                            }
                            s.emit('player killed', n);
                        });
                    }else{
                        console.log("Minority");
                        //kill no one
                    }
                }
            }


            for(var v in games[socket.room].players){
                games[socket.room].players[v].vote = "";
            }

            //killed.emit('You have been killed', "You are dead");
                       
            nextRound((socket.room).toString());
        }
    };


    var nextRound = function(room){
        if(games[socket.room].day){
            games[socket.room].day = false;
        }else{
            games[socket.room].day = true;
        }
        var day = games[socket.room].day;
        var killList = [];
        var mafiaList = [];
        var villageCount = 0;
        var mafiaCount = 0;
        console.log("ITS CHANGING TO " + games[socket.room].day);

        io.sockets.clients(room.toString()).forEach(function(s, i) {
            var side = games[room].players[s.username].side;
            if(s.alive){
                if(side === 'mafia')
                    mafiaCount++;
                else if(side === 'village'){
                    villageCount++;
                }
            }
        });

        //Check if there is more mafia than villagers or if all mafia is dead
        //if(mafiaCount>0 && mafiaCount<villageCount)
        if(true){
            io.sockets.clients(room.toString()).forEach(function(s, i) {
                if(s.alive)
                    killList.push(s.username);
            });

            //Remove username from the list that is going to be sent to him and add him back after emit
            io.sockets.clients(room.toString()).forEach(function(s, i) {
                var side = games[room].players[s.username].side;
                if(s.alive){
                    if(day){
                        var userIndex = killList.indexOf(s.username);
                        killList.splice(userIndex, 1);
                        s.emit('next round', {day: day, side: side, list: killList});
                        killList.splice(userIndex, 0, s.username);
                    }else{
                        if(side === 'village'){
                            mafiaList.push(s.username);
                            s.emit('next round', {day: day, side: side, list: []});
                        }
                    }
                }
            });  

            if(!day){
                io.sockets.clients(room.toString()).forEach(function(s, i) {
                    var side = games[room].players[s.username].side;
                    if(s.alive){
                        if(side === 'mafia')
                            s.emit('next round', {day: day, side: side, list: mafiaList});
                    }
                });
            } 

        games[socket.room].time = 10;
        games[socket.room].voteInterval = setInterval(function(){
            games[socket.room].time--;
            if(games[socket.room].time <=0){
                games[socket.room].time = 10;
                theKilling(count(socket.room), true);
            }
            io.sockets.in((socket.room).toString()).emit('vote time', games[socket.room].time);
        }, 1000);
        console.log("NEW INTERVAL ");
        console.log(games[socket.room].voteInterval);


        // else if(mafiaCount === 0){
        //     io.sockets.in(room).emit("winner", "village");
        // }
        }else{
            io.sockets.in(room).emit('');
        }
        //else if(mafiaCount >= villageCount){
        //  io.sockets.in(room).emit("winner", "mafia");
        //}
    };

    var clearVotes = function(){
        for(var room in games){
            if(games.hasOwnProperty(room)){
                if(room === (socket.room).toString()){
                    for(var p in games[room].players){
                        games[room].players[p].vote = "";
                    }
                }
            }
        }
    };


    /*
        When the player joins the room he gets the list of all the
        players that are in it, before that he broadcasts his arrival
        in the room updating all of the players "users" list
    */
    var emitListOfPlayers = function(socketRoom){
        //Send the joining client the list of players
        socket.emit("on join list players", function(){
            var nicknames = [];
            for(var room in games) {
                if (games.hasOwnProperty(room)) {
                    if(room === socketRoom){
                        for(var p in games[room].players){
                            nicknames.push(games[room].players[p].username);
                        }
                    }
                }
            }
            console.log("THOSE ARE THE NICKNAMES   ");
            console.log(nicknames);
                return nicknames;
        }());
    };

    /*
        Check if the game is ready to start,
        apply timeout so players may get ready
        if someone leaves the room, stop the timeout 
        in the disconnect socket           
    */
    var checkIfReady = function(players){
        if(players >= PLAYERS_LENGTH){
            games[socket.room].isStarting = true;
            //games[socket.room].timeout = timeout;
            timeOuts[socket.room] = setTimeout(function(){
                console.log("Game started in room " + socket.room);
                startGame(socket.room);
            }, 5000);
            console.log("Game will start in 5 seconds in room " + socket.room);
        }
    };

    /*
        Start the game, game is no longer in starting state
        Randomly sort the set of available roles and then
        assign them to the players
    */
    var startGame = function(room){
        var killList = [];
        games[socket.room].isStarting = false;
        games[socket.room].started = true;
        //Pseudo-random sort
        set.sort(function(){
            return  Math.round(Math.random());
        });

        //Set all the players roles in the room
        io.sockets.clients(room.toString()).forEach(function(s, i) {
            console.log("ROOM " + s.room + "  username " + s.username + " SIDE " + set[i].side);
            games[room].players[s.username].side = set[i].side;
            games[room].players[s.username].name = set[i].name;
            //emit list of players to ensure there is no error {set[i], list}
            if(set[i].side === 'village')
                killList.push(s.username);
        });

        io.sockets.clients(room.toString()).forEach(function(s, i) {
            var side = games[room].players[s.username].side;
            if(side === 'mafia')
                s.emit('start game', {side: side, list: killList});
            else if(side === 'village')
                s.emit('start game', {side: side, list: []});
        });
            // timeOuts[socket.room] = setTimeout(function(){

            // }, 60000);
        //Zrobic next round po N czasie, a w nextround w srodku rozpoczac licznik na nowo dla nastepnej rundy
        games[socket.room].time = 10;
        games[socket.room].voteInterval = setInterval(function(){
            games[socket.room].time--;
            if(games[socket.room].time <=0){
                games[socket.room].time = 10;
                theKilling(count(socket.room), true);
            }
            io.sockets.in((socket.room).toString()).emit('vote time', games[socket.room].time);
        }, 1000);
    };
});
