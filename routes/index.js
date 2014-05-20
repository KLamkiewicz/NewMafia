/*
 * Get sides respective views
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
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