var express = require('express');
var router = express.Router();
var app = require('../app');


/* GET home page. */

router.get('/', function(req,res){
	res.render('index', {title: "Express"});
});

router.post('/login', function(req,res){
	var name = req.body.nickname;
	if(app.currentUsers.indexOf(name) > -1){
		res.send(false);
	}else{
		//app.currentUsers.push(name);
		res.send(true);
	}
	res.end();
});




module.exports = router;