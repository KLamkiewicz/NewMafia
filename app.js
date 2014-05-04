var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var game = require('./routes/game');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(80);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static('public'));
app.use(express.static("bower_components"));

app.use('/', index);
app.use('/users', users);
app.use('/game', game);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

///

exports.currentUsers = [];
exports.room = {
    "socket.username": "" ,
    numberOfUsers: 0
};
exports.rooms = [];




//INDEX.G get exported variable from index route
io.sockets.on('connection', function (socket) {
     
        socket.on("add player", function(playerName){
            socket.set("nickname", playerName);
            //testing
            socket.get("nickname", function(err, name){
                exports.currentUsers.push(name);
            });

            // for(var i in exports.currentUsers){
            //     console.log(exports.currentUsers[i]);
            // }
        });

        //Auto-room join
        socket.on("join room", function(){
            socket.room = "default";
            socket.join(socket.room);

            socket.get("nickname", function(err, name){
                socket.emit('user', name);
            });

        });

        socket.on("create room", function(room){

        });

        socket.on("destroy room", function(room){

        });
});

module.exports = app;

