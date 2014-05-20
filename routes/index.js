/*
 * Get sides respective views
 */

exports.index = function(req, res){
	res.render('index', { title: 'Express' });
};

exports.login = function(req, res){
	res.sendfile('views/login.ejs', {root: __dirname + '../../'});
};

exports.game = function(req, res){
	res.sendfile('views/game.ejs', {root: __dirname + '../../'});
};

exports.mafia = function(req, res){
    res.sendfile('views/mafia.ejs', {root: __dirname + '../../'});
};

exports.village = function(req, res){
	res.sendfile('views/village.ejs', {root: __dirname + '../../'});
};

exports.spectator = function(req, res){
	res.sendfile('views/spectator.ejs', {root: __dirname + '../../'});
};