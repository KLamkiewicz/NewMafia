var express = require('express');
var router = express.Router();
var app = require('../app');
var name = "";

/* GET home page. */

router.get('/', function(req,res){
	res.render('index', {title: "Express"});
});

router.post('/login', function(req,res){
	name = req.body.nickname;
	if(app.currentUsers.indexOf(name) > -1){
		res.send(false);
	}else{
		res.send(true);
	}
	res.end();
});

router.get('/test', function(req, res){
	//res.sendfile(path.resolve("../public/javascripts/abc.txt"));
	//res.sendfile(__dirname + '/game.js');
	var x = "";
	res.sendfile('views/abc.txt', {'root': __dirname + '../../'});
});




module.exports = router;